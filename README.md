# Awesome Inverse PDE Problems

Research companion to **Harnessing AI for Inverse Partial Differential Equation Problems: Past, Present, and Prospects**.

Zhentao Tan, Yuze Hao, Boyi Zou, Mingsheng Long, Yi Yang, and Gang Bao.

[Explore the website](https://tanpig-x.github.io/Awesome-Inverse-PDE-problems/) · [Read the paper](https://arxiv.org/abs/2605.16966) · [PDF](https://arxiv.org/pdf/2605.16966) · [Report a correction](https://github.com/Tanpig-X/Awesome-Inverse-PDE-problems/issues)

## Explore the companion

The static website in `docs/` includes:

- **Overview** of inverse problems, inverse design, and control.
- **Method library** with 168 indexed studies and 45 verified author-associated code links, task and method-family filters, code-availability and collection filters, year selection, search, card/list layouts, and paper details. This is a curated snapshot, not an exhaustive claim about the full literature.
- **Quantitative results** with 30 literature-reported records across seven experimental protocols. Source locations, uncertainty, hardware, and cost definitions are retained.
- **Method applicability** for ten representative workflows, including setup requirements, physics access, iteration, sampling, and feedback.

Snapshot: **11 October 2026**. The public paper link points to arXiv. The companion includes additions prepared during the survey revision, so its content may be newer than the public preprint.

## Latest additions · 11 October 2026

Five studies were added in each direction. Publication year and preprint revision dates are retained separately. See [the change log](CHANGELOG.md) for the update record.

| Direction | Study | Year | Paper | Code |
| --- | --- | --- | --- | --- |
| Inverse problems | FunBCS | 2026 | [Paper](https://arxiv.org/abs/2610.04624) | [Code](https://github.com/bamb00zled82/FunBCS) |
| Inverse problems | Infinite-dimensional flow prior | 2026 | [Paper](https://arxiv.org/abs/2609.03343) | Not verified |
| Inverse problems | L-DPS | 2026 | [Paper](https://arxiv.org/abs/2606.26592) | Not verified |
| Inverse problems | DiLO | 2026 | [Paper](https://arxiv.org/abs/2604.11375) | [Code](https://github.com/haibo-research/DiLO) |
| Inverse problems | Bayesian BiLO | 2025 | [Paper](https://arxiv.org/abs/2507.17019) | [Code](https://github.com/Rayzhangzirui/BILO) |
| Inverse design | NOTES | 2026 | [Paper](https://arxiv.org/abs/2607.07682) | [Code](https://github.com/xmh3698/notes-pde-opt) |
| Inverse design | Neural scintillator design | 2026 | [Paper](https://arxiv.org/abs/2606.16309) | Not verified |
| Inverse design | Physics-guided absorber diffusion | 2026 | [Paper](https://arxiv.org/abs/2605.19611) | Not verified |
| Inverse design | Nonreciprocal photonic design | 2026 | [Paper](https://arxiv.org/abs/2603.10672) | Not verified |
| Inverse design | DiffuMeta | 2026 | [Paper](https://doi.org/10.1038/s42256-026-01218-8) | [Code](https://github.com/li-zhengz/DiffusionMetamaterials) |
| Control | NeuronCtrl | 2026 | [Paper](https://proceedings.mlr.press/v306/xu26d.html) | [Code](https://github.com/HowieHsu0126/NeuronControl) |
| Control | CINOC | 2026 | [Paper](https://arxiv.org/abs/2605.25867) | [Code](https://github.com/SOLARIS-JHU/CINOC) |
| Control | Extended FNO | 2026 | [Paper](https://arxiv.org/abs/2604.05187) | [Code](https://github.com/zhexianli-usc/Optimal-control) |
| Control | Direct & indirect control PINNs | 2026 | [Paper](https://arxiv.org/abs/2604.04920) | Not verified |
| Control | Deep Hilbert–Galerkin control | 2026 | [Paper](https://arxiv.org/abs/2603.19463) | [Code](https://github.com/JacksonHebner/Deep-Hilbert-Galerkin-Methods) |

## Preview locally

No package installation or build step is required. From the repository root:

```sh
python3 -m http.server 8765 --directory docs
```

Open `http://localhost:8765`. Use an HTTP server rather than opening `index.html` directly, because the interface loads local JSON data.

## GitHub Pages

The included workflow deploys `docs/` on pushes to `main` or manual dispatch. In **Settings → Pages → Build and deployment**, select **GitHub Actions**. The **Deploy research companion** workflow builds and publishes the static site.

## Data and maintenance

| File | Contents |
| --- | --- |
| `docs/data/methods.json` | Bibliographic records and survey taxonomy |
| `docs/data/results.json` | Quantitative records with missing-value status and provenance |
| `docs/data/results.csv` | The same quantitative records in CSV form |
| `docs/data/protocols.json` | Experimental settings and comparability limits |
| `docs/data/sources.json` | Source versions, table/page locations, URLs, and checksums |
| `docs/data/applicability.json` | Qualitative workflow matrix and interpretation notes |
| `docs/data/references.json` | References supporting the workflow matrix |

Edit the JSON records to update the website. Keep the CSV synchronized with the quantitative JSON. Run the checks before publication:

```sh
python3 scripts/validate.py
node --check docs/app.js
```

Results are **reported by the cited studies**, not rerun or independently reproduced here. Compare performance within a matched protocol. `NR` means not reported and `NA` means not applicable. Throughput is not latency, and physical control energy is not computational cost. No missing value is imputed. The applicability matrix describes representative workflows, not universal claims about an entire method family.

Paper URLs come from the survey's source records and verified primary publications. New companion additions are marked separately and do not imply inclusion in the manuscript. Code links retain `code_source` and `code_checked_at` provenance. Missing code links mean not yet verified in this index. Author-listed links that returned 404 are recorded without an active Code button. When a direct URL is unavailable, the interface explicitly provides **Find paper**, a title search, rather than inventing a paper or code link.

## Citation

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

## Shared read counter

The top-right Reads badge and footer display a shared total from [CounterAPI.com](https://counterapi.com/). This is a page-view count, not a count of unique people.

- Namespace: `tanpig-x.github.io`. Key: `awesome-inverse-pde-problems`.
- A page load at `https://tanpig-x.github.io/Awesome-Inverse-PDE-problems/` or its `index.html` sends one counting request. Switching sections, filtering, or opening a paper card sends no additional request.
- Local HTTP previews and the standalone preview make a read-only request. They do not inflate the live count.
- No browser-local counter, fabricated initial value, cookies, or custom visitor identifier is sent by our code. The third-party service still receives the network request and applies its own traffic filtering.
- Loading and unavailable states display an em dash with an explanatory tooltip. A failed counting request is not retried.
- This is a public counter service and is not an audited analytics system. If the site moves to a custom domain, update the production origin/path in `docs/reads.js` while retaining the namespace and key to preserve the total.

The counter starts from real requests to the published site. Preview visits use the read-only endpoint.

```sh
node --test scripts/reads.test.mjs
```

## Design and rights

The second design follows the [MIT CDFG survey website](https://mit-cdfg.github.io/Survey-AI-for-3D-modeling-Robotics/#view-gallery) more closely: compact institutional navigation, academic Libertinus typography, a hierarchical directory, colored task panels, structured research cards, and a shared Reads badge. It uses Zhejiang University blue and the official ZJU emblem. The original survey overview figure can be enlarged without altering its contents.

See `docs/assets/README.md` for logo, figure, and font sources. Website code follows the repository's existing MIT license. Institutional marks, the survey illustration, paper content, and cited research retain their respective rights. Libertinus fonts are distributed under their included SIL Open Font License.
