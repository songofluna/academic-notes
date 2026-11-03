---
slug: gmpixelcnn
title: pixelCNN 리뷰
date: 2026-11-03
category: generative
draft: false
sample: false
---
## 1. Why CNN for Autoregressive Image Modeling?

이미지는 픽셀들이 이차원 격자 위에 배열된 데이터다. 각 픽셀의 값은 독립적으로 결정되기보다 주변 픽셀들과 밀접한 관계를 가진다.

예를 들어 손글씨 숫자 **8**의 한 픽셀이 검은색인지 흰색인지 예측한다고 하자. 해당 픽셀의 주변에서 검은 픽셀들이 곡선을 이루고 있다면, 그 픽셀 역시 획의 일부일 가능성이 높다. 반대로 흰 픽셀들이 이어지는 공간 안에 있다면 배경일 가능성이 높다. 이처럼 이미지에서는 이웃한 픽셀들의 **공간적 패턴(Spatial Pattern)** 이 중요한 정보를 제공한다.

Convolutional Neural Network(CNN)는 이러한 구조를 학습하기에 적합하다. 작은 필터(Filter)를 이미지 전체에 반복해서 적용하므로, 선이나 곡선과 같은 패턴을 여러 위치에서 포착할 수 있기 때문이다. 동일한 필터의 가중치를 서로 다른 위치에서 공유한다는 점도 중요하다.

NADE는 이미지를 일차원 벡터로 펼쳐 조건부분포를 모델링한다. NADE도 픽셀 사이의 관계를 학습할 수 있지만, 일반적인 완전연결층은 이미지의 이차원 이웃 관계를 구조적으로 활용하지 않는다. 반면 CNN은 **지역적 연결(Local Connectivity)** 과 **가중치 공유(Weight Sharing)** 를 통해 이미지의 공간 구조를 직접 반영한다.

그렇다면 CNN을 Autoregressive Model의 조건부분포 계산에 사용할 수 있을까?

이미지의 높이와 너비를 각각 $H$, $W$라고 하고, 픽셀을 위에서 아래로, 각 행에서는 왼쪽에서 오른쪽으로 정렬하자. 이 순서를 **Raster-scan Order**라고 한다. 이미지의 결합분포는 확률의 Chain Rule에 의해

$$

p_\theta(x)=\prod_{r=1}^{H}\prod_{c=1}^{W}

p_\theta\left(x_{r,c}\mid x_{<r,c}\right)

$$

로 분해된다. 여기서 $x_{<r,c}$는 $(r,c)$보다 앞선 모든 픽셀, 즉 **이전 행의 모든 픽셀과 현재 행에서 왼쪽에 있는 픽셀들**을 의미한다.

따라서 $(r,c)$의 조건부분포를 계산할 때는 $x_{<r,c}$만 사용해야 한다. 이 제약을 만족하도록 CNN을 수정한 모델이 **PixelCNN**이다.

## 2. Why Ordinary Convolution Does Not Work

일반적인 $3\times3$ Convolution은 현재 위치를 중심으로 주변 아홉 위치의 정보를 사용한다. $(r,c)$를 예측한다고 할 때 필터가 참조하는 영역은 다음과 같다.

|  | 왼쪽 | 가운데 | 오른쪽 |

| :--: | :--: | :--: | :--: |

| **윗행** | 과거 | 과거 | 과거 |

| **현재 행** | 과거 | **현재** | 미래 |

| **아랫행** | 미래 | 미래 | 미래 |

윗행의 오른쪽 픽셀은 현재 픽셀보다 먼저 생성되므로 사용할 수 있다. 반면 현재 위치의 픽셀 값 자체, 현재 행의 오른쪽 픽셀, 아랫행의 픽셀들은 아직 생성되지 않았으므로 사용할 수 없다.

> **그림 1 — 일반 Convolution의 Information Leakage (추후 삽입)**  

> $3\times3$ 필터가 Target Pixel뿐 아니라 아직 생성되지 않은 오른쪽·아랫쪽 픽셀까지 참조하는 상황을 보여준다.

그런데 일반 Convolution은 이러한 순서를 구별하지 않는다. 현재 픽셀을 예측하는 과정에서 정답인 $x_{r,c}$나 미래 픽셀의 값이 입력으로 전달될 수 있다. 이를 **Information Leakage**라고 한다.

Autoregressive Model에서는

$$

p_\theta(x_{r,c}\mid x_{<r,c})

$$

를 학습해야 한다. 미래 픽셀이나 예측하려는 픽셀 자체를 사용한다면 더 이상 의도한 조건부분포를 계산하는 것이 아니다.

## 3. Masked Convolution

PixelCNN은 **Masked Convolution**을 사용해 이 문제를 해결한다. 필터의 일부 가중치를 0으로 고정하여, 허용되지 않은 위치의 정보가 전달되지 않도록 하는 방식이다.

Convolution Kernel을 $W$, 같은 크기의 이진 Mask를 $M$이라고 하면 실제 연산에 사용되는 가중치는

$$

\widetilde W=W\odot M

$$

이다. $\odot$는 원소별 곱(Element-wise Product)을 나타낸다. Mask에서 0인 위치의 가중치는 어떤 값을 학습하더라도 실제 Convolution에 기여하지 않는다.

### 3.1 Mask A

$3\times3$ 필터에 적용하는 **Mask A**를 다음과 같이 정의하자.

$$

M_A=

\begin{bmatrix}

1&1&1

1&0&0

0&0&0

\end{bmatrix}

$$

1인 위치는 과거 픽셀을, 0인 위치는 현재 픽셀 또는 미래 픽셀을 의미한다. 따라서 첫 번째 Layer에서는 현재 픽셀의 값을 직접 사용할 수 없다.

$$

h^{(1)}_{r,c}

=f_\theta\left(x_{\mathcal N_A(r,c)}\right)

$$

여기서 $\mathcal N_A(r,c)$는 Mask A가 허용하는 입력 위치의 집합이고, $h^{(1)}_{r,c}$는 그 위치의 픽셀들로 계산한 **Feature Vector**다.

중요한 점은 $h^{(1)}*{r,c}$와 원본 픽셀 $x*{r,c}$가 서로 다른 대상이라는 것이다. 첫 번째 Layer에 Mask A를 적용했기 때문에 $h^{(1)}*{r,c}$에는 $x*{r,c}$의 값이 들어 있지 않다.

### 3.2 Mask B

두 번째 Layer부터는 **Mask B**를 사용한다.

$$

M_B=

\begin{bmatrix}

1&1&1

1&1&0

0&0&0

\end{bmatrix}

$$

Mask A와의 차이는 가운데 위치가 1이라는 것이다.

처음에는 현재 위치를 허용하면 Information Leakage가 발생할 것처럼 보일 수 있다. 그러나 두 번째 Layer의 입력은 원본 이미지 $x$가 아니라 첫 번째 Layer에서 계산한 Feature Map $h^{(1)}$이다.

$$

h^{(2)}_{r,c}

=g_\theta\left(

h^{(1)}_{u,v}:(u,v)\in\mathcal N_B(r,c)

\right)

$$

여기서 $\mathcal N_B(r,c)$는 Mask B가 허용하는 위치의 집합이며, **현재 위치 $(r,c)$도 포함한다.**

현재 위치의 $h^{(1)}*{r,c}$는 이미 과거 픽셀들만 이용해 계산되었으므로, 두 번째 Layer에서 이 Feature Vector를 사용해도 $x*{r,c}$가 유출되지 않는다. 다른 허용 위치의 Feature Vector 역시 그보다 앞선 픽셀로만 계산되어 있으므로 같은 원리가 적용된다.

정리하면 Mask의 역할은 다음과 같다.

| 구분 | 현재 위치 사용 | 이유 |

|---|---|---|

| **Mask A** | 불가능 | 첫 번째 Layer의 입력은 실제 픽셀 값이기 때문 |

| **Mask B** | 가능 | 이후 Layer의 입력은 인과적 제약을 만족하는 Feature Vector이기 때문 |

따라서 일반적인 PixelCNN에서는 **첫 번째 Masked Convolution에 Mask A를 적용하고, 이후의 Masked Convolution에는 Mask B를 적용**한다.

## 4. Blind Spot

Masked Convolution은 현재·미래 픽셀의 정보가 유출되는 것을 막는다. 하지만 반대로, **사용할 수 있는 과거 픽셀 중 일부에 정보 전달 경로가 존재하지 않는 문제**가 생길 수 있다. 이를 **Blind Spot**이라고 한다.

### 4.1 두 개의 Masked Convolution Layer

다음과 같은 예시를 생각하자.

- 입력 이미지의 크기: $4\times5$
- 예측할 Target Pixel: $(r,c)=(3,3)$
- 첫 번째 Layer: $3\times3$ Mask A
- 두 번째 Layer: $3\times3$ Mask B
- 모든 좌표는 1부터 시작하고, 이미지 바깥쪽은 Padding 처리한다고 가정한다.

Target은 세 번째 행, 세 번째 열이다. Raster-scan Order에서 Target보다 앞선 픽셀은 첫 번째·두 번째 행의 모든 픽셀과 세 번째 행의 첫 두 픽셀이다.

이제 두 번째 Layer의 $h^{(2)}_{3,3}$이 어떤 첫 번째 Layer의 Feature Vector를 참조하는지 확인하자. Mask B에 의해 다음 다섯 위치가 허용된다.

$$

h^{(1)}_{2,2},\quad

h^{(1)}_{2,3},\quad

h^{(1)}_{2,4},\quad

h^{(1)}_{3,2},\quad

h^{(1)}_{3,3}

$$

각 Feature Vector는 다시 Mask A가 허용하는 Raw Input Pixel만 참조한다. 이러한 경로를 모두 추적하면 실제로 Target의 예측에 도달할 수 있는 원본 픽셀은 아래와 같다.

|  | $c=1$ | $c=2$ | $c=3$ | $c=4$ | $c=5$ |

|---|:---:|:---:|:---:|:---:|:---:|

| $r=1$ | ● | ● | ● | ● | ● |

| $r=2$ | ● | ● | ● | ● | **○** |

| $r=3$ | ● | ● | **T** | – | – |

| $r=4$ | – | – | – | – | – |

- **●**: Target의 예측에 정보를 전달할 수 있는 Raw Input Pixel
- **○**: 과거 픽셀이지만 정보 전달 경로가 없는 위치(Blind Spot)
- **T**: 예측할 Target Pixel $(3,3)$
- **–**: 아직 생성되지 않은 미래 픽셀

$(2,5)$는 Target보다 윗행에 있으므로 명백히 과거 픽셀이다. 그러나 이 두 Layer의 Masked Convolution을 거쳐서는 $(2,5)$의 정보가 $h^{(2)}_{3,3}$까지 전달되지 않는다.

예를 들어 $h^{(1)}*{2,4}$는 같은 행에서 자신의 오른쪽에 있는 $x*{2,5}$를 참조할 수 없다. 또한 $h^{(1)}*{3,3}$는 바로 위쪽의 $x*{2,4}$까지 참조할 수 있지만, $x_{2,5}$는 $3\times3$ 범위 밖에 있다. 다른 허용 경로로도 $x_{2,5}$에 도달하지 못한다.

이것은 단순히 픽셀이 멀리 있어서 생기는 문제가 아니다. $(2,5)$는 두 개의 일반적인 $3\times3$ Convolution을 쌓았을 때의 공간적 범위 안에 있지만, **Mask의 방향 제약 때문에 연결 경로가 형성되지 않는다.**

> **Interactive Component (추후 구현)**  

> $4\times5$ 이미지에서 Target을 $(3,3)$으로 고정한다. 첫 번째 Layer의 Mask A, 두 번째 Layer의 Mask B를 순서대로 표시하고, 두 번째 Layer의 Target에서 역방향으로 Raw Input까지 연결 경로를 추적한다. 도달 가능한 픽셀과 Blind Spot $(2,5)$를 서로 다른 표시로 구분한다.

### 4.2 Blind Spot을 해결하려면?

Layer를 깊게 쌓으면 Receptive Field의 크기는 커지지만, 단순한 Masked Convolution을 반복하는 것만으로는 특정 방향의 구조적 Blind Spot이 남을 수 있다.

이 문제를 해결하기 위해 **Gated PixelCNN**에서는 두 가지 Convolution 경로를 구분한다.

- **Vertical Stack:** 현재 픽셀보다 위에 있는 행들의 정보를 처리한다.
- **Horizontal Stack:** 현재 행에서 왼쪽 픽셀들의 정보를 처리한다.

Vertical Stack에서 얻은 정보를 Horizontal Stack으로 전달하면, 이미 생성된 윗행의 정보와 현재 행 왼쪽의 정보를 함께 사용할 수 있다. 두 경로를 적절히 결합하되 미래 정보가 전달되지 않도록 설계하여 Blind Spot을 제거한다.

이는 원래 PixelCNN의 Mask A/B 원리와 구분되는 **개선된 구조**다.

## 5. PixelCNN Architecture

PixelCNN은 여러 개의 Masked Convolution Layer를 쌓아, 각 위치에서 다음 픽셀의 **조건부 확률분포(Conditional Probability Distribution)** 를 출력한다.

기본적인 구조는 다음과 같이 정리할 수 있다.

```text

Input Image (H × W)

        ↓

Masked Convolution — Mask A

        ↓

Nonlinearity

        ↓

Masked Convolution — Mask B

        ↓

   (반복 / Residual Blocks)

        ↓

  1 × 1 Convolution

        ↓

       Logits

        ↓

Softmax (각 픽셀의 조건부분포)

```

첫 번째 Layer에서는 Mask A로 현재 픽셀을 차단하고, 이후 Layer에서는 Mask B를 사용해 과거 정보를 결합한다. $1\times1$ Convolution은 같은 공간 위치의 Feature Channel만 결합하므로, 앞에서 유지한 인과적 제약을 깨지 않는다. 일반적인 PixelCNN은 픽셀의 공간적 위치를 유지하며 처리하므로, 해상도를 줄이는 Pooling을 사용하지 않는다.

예를 들어 각 픽셀이 $0,1,\ldots,255$ 중 하나의 밝기 값을 갖는 8-bit Grayscale Image라면, 각 위치에서 256개의 Logit을 출력하고 Softmax를 적용할 수 있다.

$$

p_\theta(x_{r,c}=k\mid x_{<r,c})

=\frac{\exp(a_{r,c,k})}

{\sum_{j=0}^{255}\exp(a_{r,c,j})},

\qquad k\in0,\ldots,255

$$

$a_{r,c,k}$는 픽셀 $(r,c)$의 값이 $k$일 때에 대응하는 Logit이다. 이는 단일한 픽셀 값을 바로 출력하는 것이 아니라, **가능한 픽셀 값 전체에 대한 확률분포를 출력한다**는 의미다.

흑백 값이 $0$ 또는 $1$뿐인 Binarized Image라면 각 위치에서 Bernoulli 분포의 모수 하나를 예측하고 Sigmoid를 사용할 수도 있다.

원래 PixelCNN 논문에서는 첫 Layer에 $7\times7$ Mask A, 이후 Residual Block 등에 $3\times3$ Mask B를 사용하고, 마지막에 $1\times1$ Convolution과 출력 분포를 구성했다. 여기서는 Mask의 작동 원리를 설명하기 위해 $3\times3$ 필터 두 개를 사용한 단순화된 구조를 먼저 살펴보았다.

## 6. Training vs. Generation

PixelCNN은 학습할 때와 새로운 이미지를 생성할 때 계산 방식에 중요한 차이가 있다.

### 6.1 Training: 모든 픽셀의 조건부분포를 병렬 계산

학습에서는 완성된 실제 이미지 $x$가 주어진다. 이 이미지를 모델에 한 번 입력하면, Masked Convolution에 의해 각 위치가 **자신보다 앞선 픽셀만 사용하도록 제한된 상태에서** 모든 위치의 조건부분포를 동시에 계산할 수 있다.

이미지 한 장에 대한 Negative Log-Likelihood(NLL)는

$$

\mathcal L(\theta;x)

=-\log p_\theta(x)

=-\sum_{r=1}^{H}\sum_{c=1}^{W}

\log p_\theta(x_{r,c}\mid x_{<r,c})

$$

이다. 여러 학습 이미지에 대해서는 이 손실을 평균하여 최소화한다.

여기서 실제 이미지의 픽셀을 입력으로 사용하더라도 Information Leakage가 발생하지 않는다. 각 위치의 예측 결과로 정답인 현재 픽셀이나 미래 픽셀의 값이 전달되지 않도록 Mask가 제한하기 때문이다.

따라서 PixelCNN은 순차적인 확률분포를 모델링하지만 **Training 단계에서는 모든 픽셀 위치의 조건부분포를 병렬로 계산**할 수 있다.

### 6.2 Generation: 픽셀을 하나씩 Sampling

새로운 이미지를 생성할 때는 완성된 이미지가 주어져 있지 않다. 따라서 아직 생성되지 않은 픽셀의 실제 값을 입력할 수 없다.

생성은 Raster-scan Order에 따라 순차적으로 이루어진다.

1. 첫 번째 픽셀을 $p_\theta(x_{1,1})$에서 Sampling한다.
2. 생성된 픽셀을 조건으로 다음 픽셀의 분포 $p_\theta(x_{1,2}\mid x_{1,1})$를 계산한다.
3. 새로운 픽셀을 Sampling한 뒤, 생성된 결과를 다시 모델에 입력한다.
4. 마지막 픽셀까지 같은 과정을 반복한다.

일반적으로 $i$번째 픽셀에서는

$$

x_i\sim p_\theta(x_i\mid x_1,\ldots,x_{i-1})

$$

을 수행한다. 여기서 분포의 조건은 이전에 **실제로 Sampling한 값**들이다.

학습과 생성의 차이를 비교하면 다음과 같다.

|  | Training | Generation |

|---|---|---|

| 입력 | 완성된 실제 이미지 | 지금까지 생성한 픽셀 |

| 조건부분포 계산 | 모든 위치에서 병렬 수행 가능 | 생성 순서에 따라 반복 |

| 픽셀 값 | 데이터셋의 정답 사용 | 모델 분포에서 Sampling |

| 목적 | NLL 최소화 | 새로운 이미지 생성 |

PixelCNN의 장점 중 하나는 Convolution을 이용해 Training을 병렬화할 수 있다는 점이다. 반면 Generation에서는 이전에 생성한 픽셀이 다음 픽셀의 조건이 되기 때문에, **픽셀을 생성하는 순서 자체는 병렬화할 수 없다.** 구현에 따라 중간 계산을 재사용할 수는 있지만, 순차적인 의존성은 유지된다.

## 7. Summary

PixelCNN은 이미지의 공간 구조를 활용하면서 Autoregressive Factorization을 만족하도록 설계한 CNN 기반 생성모델이다.

일반적인 Convolution은 현재·미래 픽셀의 정보를 사용할 수 있으므로 그대로 적용할 수 없지만, **첫 번째 Layer의 Mask A와 이후 Layer의 Mask B**를 통해 인과적 제약을 유지할 수 있다. 다만 기본 Masked Convolution에는 일부 과거 픽셀의 정보를 활용하지 못하는 **Blind Spot**이 존재하며, 이를 해결하기 위한 방법 중 하나가 Vertical Stack과 Horizontal Stack을 결합한 Gated PixelCNN이다.

학습 시에는 모든 픽셀의 조건부분포를 병렬로 계산할 수 있지만, 실제 이미지를 생성할 때는 픽셀을 순서대로 Sampling해야 한다.

## References

1. van den Oord, A., Kalchbrenner, N., & Kavukcuoglu, K. (2016). *[Pixel Recurrent Neural Networks]([https://proceedings.mlr.press/v48/oord16.html](https://proceedings.mlr.press/v48/oord16.html))*. ICML. — PixelCNN, Mask A/B, 학습과 생성 과정.
2. van den Oord, A., Kalchbrenner, N., et al. (2016). *[Conditional Image Generation with PixelCNN Decoders]([https://arxiv.org/abs/1606.05328](https://arxiv.org/abs/1606.05328))*. NeurIPS. — Blind Spot과 Gated PixelCNN의 Vertical/Horizontal Stack.

