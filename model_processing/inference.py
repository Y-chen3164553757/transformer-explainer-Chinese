import os
import time
import argparse
import numpy as np
import onnxruntime as ort
from transformers import BertTokenizer

def softmax(x):
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum(axis=-1)

def sample_next_token(logits, temperature=0.7, top_k=50, top_p=0.9):
    if temperature == 0:
        return np.argmax(logits)
        
    logits = logits / temperature
    
    if top_k > 0:
        indices_to_remove = logits < np.partition(logits, -top_k)[-top_k]
        logits[indices_to_remove] = -float('Inf')
        
    probs = softmax(logits)
    
    if top_p < 1.0:
        sorted_indices = np.argsort(probs)[::-1]
        sorted_probs = probs[sorted_indices]
        cumulative_probs = np.cumsum(sorted_probs)
        
        sorted_indices_to_remove = cumulative_probs > top_p
        sorted_indices_to_remove[1:] = sorted_indices_to_remove[:-1].copy()
        sorted_indices_to_remove[0] = False
        
        indices_to_remove = sorted_indices[sorted_indices_to_remove]
        probs[indices_to_remove] = 0
        probs = probs / probs.sum()
        
    return np.random.choice(len(probs), p=probs)

def generate_text_onnx(session, tokenizer, prompt, max_length=150, temperature=0.7, top_k=50, top_p=0.9, repetition_penalty=1.2):
    inputs = tokenizer(prompt, return_tensors="np", add_special_tokens=False)
    input_ids = inputs["input_ids"]
    prompt_len = input_ids.shape[1]
    
    for _ in range(max_length - prompt_len):
        inputs_dict = {session.get_inputs()[0].name: input_ids}
        outputs = session.run(None, inputs_dict)
        logits = outputs[0]
        next_token_logits = logits[0, -1, :].copy()
        
        if repetition_penalty != 1.0:
            for token_id in set(input_ids[0]):
                logit = next_token_logits[token_id]
                if logit < 0:
                    next_token_logits[token_id] = logit * repetition_penalty
                else:
                    next_token_logits[token_id] = logit / repetition_penalty
        
        next_token_id = sample_next_token(
            next_token_logits, 
            temperature=temperature, 
            top_k=top_k, 
            top_p=top_p
        )
        
        input_ids = np.concatenate([input_ids, [[next_token_id]]], axis=-1)
        
        if next_token_id == 50256 or next_token_id == tokenizer.sep_token_id:
            break
            
    generated_text = tokenizer.decode(input_ids[0], skip_special_tokens=True)
    clean_text = "".join(generated_text.split())
    return clean_text

def main():
    parser = argparse.ArgumentParser(description="GPT-2 最终方案 (7000词表 INT4) 推理")
    parser.add_argument("--onnx_path", type=str, default="model/model_int4.onnx", help="ONNX 模型文件路径")
    parser.add_argument("--vocab_path", type=str, default="model/vocab.txt", help="词表路径")
    parser.add_argument("--temperature", type=float, default=0.7, help="采样温度 (0为贪婪搜索)")
    parser.add_argument("--top_k", type=int, default=50, help="Top-K 限制")
    parser.add_argument("--top_p", type=float, default=0.9, help="Top-P 限制")
    parser.add_argument("--repetition_penalty", type=float, default=1.2, help="重复惩罚系数")
    args = parser.parse_args()

    # 工作目录自适应
    onnx_path = args.onnx_path
    vocab_path = args.vocab_path
    if not os.path.exists(onnx_path):
        onnx_path = os.path.join(os.path.dirname(__file__), onnx_path)
    if not os.path.exists(vocab_path):
        vocab_path = os.path.join(os.path.dirname(__file__), vocab_path)

    # 载入分词器
    print(f"正在载入分词器: {vocab_path} ...")
    tokenizer = BertTokenizer(vocab_path)

    # 载入 ONNX Runtime
    print(f"正在载入最终 INT4 量化模型: {onnx_path} ...")
    providers = ['CPUExecutionProvider']
    if 'CUDAExecutionProvider' in ort.get_available_providers():
        providers = ['CUDAExecutionProvider'] + providers
    print(f"推理设备优先级: {providers}")
    session = ort.InferenceSession(onnx_path, providers=providers)
    
    print("\n✅ 最终版模型加载完毕！输入 'exit' 或 'q' 退出交互式生成。")
    print("=" * 70)

    while True:
        try:
            prompt = input("\n输入 Prompt >>> ")
            if prompt.strip().lower() in ["exit", "q"]:
                break
            if not prompt.strip():
                continue
                
            t_start = time.time()
            result = generate_text_onnx(
                session=session,
                tokenizer=tokenizer,
                prompt=prompt,
                max_length=150,
                temperature=args.temperature,
                top_k=args.top_k,
                top_p=args.top_p,
                repetition_penalty=args.repetition_penalty
            )
            t_duration = time.time() - t_start
            
            print("-" * 50)
            print(f"回答：{result}")
            print("-" * 50)
            print(f"⏱️ 推理生成耗时: {t_duration:.2f} 秒 | 生成速度: {len(result)/t_duration:.1f} 字/秒")
        except KeyboardInterrupt:
            print("\n退出。")
            break
        except Exception as e:
            print(f"运行出错: {e}")

if __name__ == "__main__":
    main()
