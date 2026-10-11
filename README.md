# Awesome AI for Inverse PDE Problems

A curated collection of papers and code on **inverse problems**, **inverse design**, and **PDE control**. This repository accompanies our survey:

**[Harnessing AI for Inverse Partial Differential Equation Problems: Past, Present, and Prospects](https://arxiv.org/abs/2605.16966)**

Zhentao Tan, Yuze Hao, Boyi Zou, Mingsheng Long, Yi Yang, and Gang Bao.

**[Website](https://tanpig-x.github.io/Awesome-Inverse-PDE-problems/) · [Paper](https://arxiv.org/abs/2605.16966) · [PDF](https://arxiv.org/pdf/2605.16966) · [Full Paper List](https://tanpig-x.github.io/Awesome-Inverse-PDE-problems/#view-gallery)**

<p align="center">
  <img src="docs/assets/survey-overview.png" alt="A unified framework for PDE-governed inverse problems, inverse design, and control" width="900">
</p>

The website provides a searchable archive of **168 studies**, including **45 papers with author-associated code**, together with [reported quantitative results](https://tanpig-x.github.io/Awesome-Inverse-PDE-problems/#view-results) and [method applicability](https://tanpig-x.github.io/Awesome-Inverse-PDE-problems/#view-applicability).

**Latest update · 11 October 2026:** Added 15 recent studies, five in each direction.

## Contents

- [Inverse Problems](#inverse-problems)
- [Inverse Design](#inverse-design)
- [PDE Control](#pde-control)
- [Contributing](#contributing)
- [Citation](#citation)

The tables below highlight representative studies and recent additions. Code links point to author-associated repositories. A dash means that a code repository has not yet been verified in this collection.

## Inverse Problems

Recover unknown parameters, fields, or dynamics from observations. [Browse all papers →](https://tanpig-x.github.io/Awesome-Inverse-PDE-problems/#view-gallery?task=inverse_problems)

| Year | Paper | Code |
| --- | --- | --- |
| 2026 | [Backward-Consistent Diffusion Sampling for Sparsely Observed PDE Inverse Problems](https://arxiv.org/abs/2610.04624) | [Code](https://github.com/bamb00zled82/FunBCS) |
| 2026 | [BiLO: Bilevel Local Operator Learning for PDE Inverse Problems](https://doi.org/10.1016/j.jcp.2026.114679) | [Code](https://github.com/Rayzhangzirui/BILO) |
| 2026 | [DiLO: Decoupling Generative Priors and Neural Operators via Diffusion Latent Optimization for Inverse Problems](https://arxiv.org/abs/2604.11375) | [Code](https://github.com/haibo-research/DiLO) |
| 2026 | [Latent Diffusion Posterior Sampling with Surrogate Likelihood Guidance for PDE Inverse Problems](https://arxiv.org/abs/2606.26592) | — |
| 2026 | [Learning Informative Prior with Infinite-Dimensional Continuous Normalizing Flow for Bayesian Inverse Problem](https://arxiv.org/abs/2609.03343) | — |
| 2025 | [Bayesian BiLO: Bilevel Local Operator Learning for Efficient Uncertainty Quantification of Bayesian PDE Inverse Problems with Low-Rank Adaptation](https://arxiv.org/abs/2507.17019) | [Code](https://github.com/Rayzhangzirui/BILO) |
| 2024 | [DiffusionPDE: Generative PDE-solving under partial observation](https://papers.nips.cc/paper_files/paper/2024/hash/eb3878c1dcbfff9ee95d5d033e5f5942-Abstract-Conference.html) | [Code](https://github.com/jhhuangchloe/DiffusionPDE) |
| 2023 | [Neural Inverse Operators for Solving PDE Inverse Problems](https://proceedings.mlr.press/v202/molinaro23a.html) | — |
| 2019 | [Analyzing Inverse Problems with Invertible Neural Networks](https://openreview.net/forum?id=rJed6j0cKX) | — |
| 2019 | [Physics-informed neural networks: A deep learning framework for solving forward and inverse problems involving nonlinear partial differential equations](https://www.sciencedirect.com/science/article/pii/S0021999118307125) | [Code](https://github.com/maziarraissi/PINNs) |

## Inverse Design

Find geometries, materials, or physical configurations that achieve a target response. [Browse all papers →](https://tanpig-x.github.io/Awesome-Inverse-PDE-problems/#view-gallery?task=inverse_design)

| Year | Paper | Code |
| --- | --- | --- |
| 2026 | [Algebraic Language Models for Inverse Design of Metamaterials via Diffusion Transformers](https://doi.org/10.1038/s42256-026-01218-8) | [Code](https://github.com/li-zhengz/DiffusionMetamaterials) |
| 2026 | [Deep learning assisted inverse design of nonreciprocal multilayer photonic structures](https://arxiv.org/abs/2603.10672) | — |
| 2026 | [Neural network inverse design of nanophotonic scintillators](https://arxiv.org/abs/2606.16309) | — |
| 2026 | [Neural Operator-enabled Topology-informed Evolutionary Strategy for PDE-Constrained Optimization](https://arxiv.org/abs/2607.07682) | [Code](https://github.com/xmh3698/notes-pde-opt) |
| 2026 | [Physics Guided Conditional Diffusion Framework for Generative Inverse Design of Manufacturable Metasurface based Absorbers](https://arxiv.org/abs/2605.19611) | — |
| 2024 | [Compositional Generative Inverse Design](https://arxiv.org/abs/2401.13171) | [Code](https://github.com/AI4Science-WestlakeU/cindm) |
| 2023 | [Diffusion models beat GANs on topology optimization](https://arxiv.org/abs/2208.09591) | [Code](https://github.com/francoismaze/topodiff) |
| 2021 | [Physics-informed neural networks with hard constraints for inverse design](https://arxiv.org/abs/2102.04626) | [Code](https://github.com/lululxvi/hpinn) |
| 2020 | [Simulator-based training of generative neural networks for the inverse design of metasurfaces](https://arxiv.org/abs/1906.07843) | [Code](https://github.com/jonfanlab/GLOnet) |
| 2018 | [Training deep neural networks for the inverse design of nanophotonic structures](https://arxiv.org/abs/1710.04724) | — |

## PDE Control

Learn actions and policies that steer PDE-governed systems toward a desired state. [Browse all papers →](https://tanpig-x.github.io/Awesome-Inverse-PDE-problems/#view-gallery?task=control)

| Year | Paper | Code |
| --- | --- | --- |
| 2026 | [CINOC: Cardinality-Invariant Neural Operator Policies for Scalable PDE Control](https://arxiv.org/abs/2605.25867) | [Code](https://github.com/SOLARIS-JHU/CINOC) |
| 2026 | [Deep Hilbert–Galerkin Methods for Infinite-Dimensional PDEs and Optimal Control](https://arxiv.org/abs/2603.19463) | [Code](https://github.com/JacksonHebner/Deep-Hilbert-Galerkin-Methods) |
| 2026 | [FNO∠θ: Extended Fourier neural operator for learning state and optimal control of distributed parameter systems](https://arxiv.org/abs/2604.05187) | [Code](https://github.com/zhexianli-usc/Optimal-control)¹ |
| 2026 | [NeuronCtrl: Geometry-Aware Safe Closed-Loop Generative Control for Neuronal Microenvironment Dynamics](https://proceedings.mlr.press/v306/xu26d.html) | [Code](https://github.com/HowieHsu0126/NeuronControl) |
| 2026 | [Physics-informed neural networks for PDE-constrained optimization and control](https://doi.org/10.1007/s42967-025-00499-x) | [Code](https://github.com/ComputationalScienceLaboratory/control-pinns) |
| 2026 | [PINNs in PDE Constrained Optimal Control Problems: Direct vs Indirect Methods](https://arxiv.org/abs/2604.04920) | — |
| 2025 | [From Uncertain to Safe: Conformal Adaptation of Diffusion Models for Safe PDE Control](https://proceedings.mlr.press/v267/hu25t.html) | [Code](https://github.com/AI4Science-WestlakeU/safediffcon) |
| 2024 | [DiffPhyCon: a generative approach to control complex physical systems](https://arxiv.org/abs/2407.06494) | [Code](https://github.com/AI4Science-WestlakeU/diffphycon) |
| 2024 | [Neural operators for bypassing gain and control computations in PDE backstepping](https://doi.org/10.1109/TAC.2023.3347499) | [Code](https://github.com/lukebhan/NeuralOperatorsForGainKernels) |
| 2020 | [Learning to Control PDEs with Differentiable Physics](https://vladlen.info/papers/PDE-control.pdf) | [Code](https://github.com/p-holl/PDE-Control) |

¹ The Extended FNO repository currently provides the Burgers boundary-condition module.

## Contributing

Suggestions and corrections are welcome through [issues](https://github.com/Tanpig-X/Awesome-Inverse-PDE-problems/issues) or pull requests. For a new paper, please include its title, year, task category, paper link, and author-released code if available.

## Citation

If you find this survey useful, please cite:

```bibtex
@misc{tan2026harnessingaiinversepartial,
  title={Harnessing AI for Inverse Partial Differential Equation Problems: Past, Present, and Prospects},
  author={Tan, Zhentao and Hao, Yuze and Zou, Boyi and Long, Mingsheng and Yang, Yi and Bao, Gang},
  year={2026},
  eprint={2605.16966},
  archivePrefix={arXiv},
  primaryClass={cs.AI},
  url={https://arxiv.org/abs/2605.16966}
}
```
