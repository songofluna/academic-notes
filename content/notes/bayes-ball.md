---
slug: "bayes-ball"
title: "조건부 독립과 Bayes ball"
date: "2026-10-06"
category: "probability"
summary: "Chain, fork, collider의 기본 구조를 통해 관측 여부가 정보의 흐름에 주는 영향을 정리한다."
tags: "Conditional Independence, Graphical Models"
draft: false
sample: true
---

> 실제 작성된 게시글이 아니라 레이아웃 확인용 샘플이다.

방향 그래프에서는 화살표가 직접 연결되어 있는지보다 **어떤 경로가 열려 있는지**가 더 중요하다.

## 세 가지 기본 구조

- Chain: $X \rightarrow Z \rightarrow Y$
- Fork: $X \leftarrow Z \rightarrow Y$
- Collider: $X \rightarrow Z \leftarrow Y$

일반적인 chain이나 fork는 가운데 변수 $Z$를 관측하면 경로가 차단된다. 하지만 collider는 반대로 $Z$ 또는 그 자손을 관측하면 경로가 열릴 수 있다.

## 예제를 직접 생각해 보기

각 변수의 의미를 정한 다음, 독립성 가정을 수식으로 명확하게 적어 보면 이해하기 쉽다.
