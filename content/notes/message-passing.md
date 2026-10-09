---
slug: "message-passing"
title: "GNN의 Message Passing 다시 보기"
date: "2026-10-02"
category: "graphs"
summary: "이웃 노드의 정보를 모아서 표현을 갱신하는 GNN의 가장 기본적인 구조를 살펴본다."
tags: "GNN, Representation Learning"
draft: false
sample: true
---

> 사이트 기능 확인을 위한 예시 내용입니다.

Graph Neural Network의 한 층은 노드 주변에서 정보를 받아 자신의 표현을 갱신하는 연산으로 볼 수 있다.

## Message, Aggregate, Update

```text
Neighbors → Messages → Aggregation → Node Update
```

각 단계에서 어떤 정보를 사용할지, 어떻게 결합할지는 모델에 따라 달라진다.

### 다음에 채울 내용

- GCN의 정규화 행렬
- GraphSAGE의 샘플링과 집계
- Attention 기반 메시지 전달
