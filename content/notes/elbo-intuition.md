---
slug: "elbo-intuition"
title: "ELBO를 최대화한다는 것"
date: "2026-10-08"
category: "generative"
summary: "로그 주변우도와 KL divergence를 다시 유도하면서, 왜 ELBO를 목적함수로 사용하는지 정리한다."
tags: "Variational Inference, ELBO, Bayesian Inference"
draft: false
sample: true
---

> 이 글은 사이트 기능을 보여주기 위한 예시 노트입니다. 실제 공부 기록으로 교체하세요.

잠재변수가 있는 모형에서 $p(z\mid x)$를 정확하게 계산하기 어려우면, 계산하기 쉬운 $q(z)$로 근사할 수 있다.

## 먼저 식을 분해해 보자

$$
\log p(x) = \mathcal{L}(q) + \mathrm{KL}\!\left(q(z)\,\|\,p(z\mid x)\right)
$$

관측값 $x$와 모형의 파라미터가 고정되었다면 왼쪽 항은 $q$에 대해 상수다. KL divergence는 항상 음수가 아니므로 $\mathcal{L}(q)$는 $\log p(x)$의 하한이다.

## 핵심 질문

- 왜 posterior를 직접 계산하기 어려울까?
- 어떤 분포족을 선택해야 ELBO를 계산하기 쉬울까?
- EM과 variational inference는 어떻게 연결될까?

### 간단한 Python 예제

```python
import numpy as np

def normal_kl(mu, sigma):
    return 0.5 * (mu**2 + sigma**2 - 1 - np.log(sigma**2))

print(normal_kl(1.0, 0.8))
```

직접 움직여 보고 싶다면 아래 시각화를 사용해 볼 수 있다.

[demo:normal-kl]
