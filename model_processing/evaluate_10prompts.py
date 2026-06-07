import os
import time
import numpy as np
import onnxruntime as ort
from transformers import BertTokenizer

# 基础概率采样函数
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

# ONNX 生成
def generate_onnx(session, tokenizer, prompt, max_len=45, temp=0.7, repetition_penalty=1.2):
    inputs = tokenizer(prompt, return_tensors="np", add_special_tokens=False)
    input_ids = inputs["input_ids"]
    prompt_len = input_ids.shape[1]
    
    t_start = time.time()
    first_token_time = None
    
    for i in range(max_len):
        inputs_dict = {session.get_inputs()[0].name: input_ids}
        outputs = session.run(None, inputs_dict)
        logits = outputs[0]
        next_token_logits = logits[0, -1, :].copy()
        
        # 重复惩罚
        if repetition_penalty != 1.0:
            for token_id in set(input_ids[0]):
                logit = next_token_logits[token_id]
                if logit < 0:
                    next_token_logits[token_id] = logit * repetition_penalty
                else:
                    next_token_logits[token_id] = logit / repetition_penalty
                    
        next_token_id = sample_next_token(next_token_logits, temperature=temp)
        if first_token_time is None:
            first_token_time = time.time() - t_start
            
        input_ids = np.concatenate([input_ids, [[next_token_id]]], axis=-1)
        if next_token_id == tokenizer.sep_token_id or next_token_id == 50256:
            break
            
    total_time = time.time() - t_start
    gen_tokens = input_ids.shape[1] - prompt_len
    text = tokenizer.decode(input_ids[0], skip_special_tokens=True)
    clean_text = "".join(text.split())
    
    return clean_text, first_token_time, total_time, gen_tokens

def main():
    print(f"=============================================")
    print(f"🚀 最终发布方案：7000词表 INT4 级模型 10大 Prompt 评测")
    print(f"=============================================\n")

    # 路径配置
    onnx_path = "model/model_int4.onnx"
    vocab_path = "model/vocab.txt"

    if not os.path.exists(onnx_path):
        onnx_path = os.path.join(os.path.dirname(__file__), onnx_path)
    if not os.path.exists(vocab_path):
        vocab_path = os.path.join(os.path.dirname(__file__), vocab_path)

    # 载入分词器
    tokenizer = BertTokenizer(vocab_path)

    # 载入 ONNX 模型
    if os.path.exists(onnx_path):
        try:
            print("正在加载最终 ONNX INT4 (71.2MB) 模型...")
            providers = ['CPUExecutionProvider']
            if 'CUDAExecutionProvider' in ort.get_available_providers():
                providers = ['CUDAExecutionProvider'] + providers
            session = ort.InferenceSession(onnx_path, providers=providers)
            print("加载成功！开始运行测试用例...\n")
        except Exception as e:
            print(f"❌ 加载 ONNX 失败: {e}")
            return
    else:
        print(f"❌ 找不到 ONNX 模型: {onnx_path}")
        return

    # 10个核心测试 Prompt
    test_prompts = [
        # 用户指定的 5 个 Prompt
        "数据可视化帮助用户",
        "人工智能正在改变",
        "当宇宙飞船接近",
        "在荒芜的星球上他们发现了",
        "深度学习技术的",
        # 补充的 5 个多元化 Prompt
        "随着大语言模型的快速发展",
        "研究人员提出了一种新的",
        "在未来的城市中，",
        "气候变化对全球经济",
        "为了提高程序的运行效率，"
    ]

    for i, prompt in enumerate(test_prompts):
        print(f"【测试用例 {i+1}/10】: '{prompt}'")
        print("-" * 75)
        try:
            text, t_first, t_total, tokens = generate_onnx(
                session, tokenizer, prompt, max_len=45
            )
            print(f"🟢 [生成成功] (首字延迟: {t_first:.3f}s | 速度: {tokens/t_total:.1f} tok/s | 长度: {tokens} tokens):")
            print(f"   {text}")
        except Exception as e:
            print(f"❌ 运行失败: {e}")
        print("=" * 75 + "\n")

if __name__ == "__main__":
    main()
