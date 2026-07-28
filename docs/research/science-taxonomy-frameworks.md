# 理科领域分类依据

三维公共知识空间收录数学、物理、化学和生物各 46 个主节点。单个主节点对应一门课程的核心模块或一个可独立继续深入的专业方向。分类框架同时参考学会分类、本科课程、研究资助分类和公开知识地图。

## 数学

数学三维目录直接投影 `src/data/mathMap.ts` 的 46 个主节点。两个视图共用节点名称、简介、学习层级、场域标签和前置关系。`numbers`、`logic` 和 `sets` 在三维公共数据中分别使用稳定 ID `quantity-arithmetic`、`mathematical-logic` 和 `set-theory`。

主要分支为数学基础、代数学、几何与拓扑、分析学、离散数学、概率与统计、应用数学。

## 物理

物理目录使用 [APS Physics Subject Headings](https://physh-alpha.aps.org/about) 和 [APS 学术分部](https://www.aps.org/membership/units) 检查学术分支覆盖，使用 [APS 期刊范围](https://journals.aps.org/scope) 补充量子材料、非平衡系统、光子学和现代凝聚态方向。[MIT Physics Subjects](https://physics.mit.edu/academic-programs/subjects/) 和 [Caltech Physics Option](https://www.catalog.caltech.edu/current/information-for-undergraduate-students/graduation-requirements-all-options/physics-option-ph/) 用于校准前置顺序。[Paris-Saclay 物理地图](https://vulgarisation.fr/projet/la_carte_de_la_physique/?lang=en) 和 [The Map of Physics](https://www.youtube.com/watch?v=ZihywtixUYo) 用于检查宏观层级的可辨识性。

物理目录包含八个分支簇：

- 方法与经典基础，6 个节点。
- 连续介质、波与场，8 个节点。
- 热学与统计物理，4 个节点。
- 复杂物质与生命系统，3 个节点。
- 量子、原子与信息，6 个节点。
- 凝聚态与材料，6 个节点。
- 核、粒子、等离子体与束流，7 个节点。
- 引力与宇宙，6 个节点。

地球物理、气候物理、医学物理、量子引力和弦理论保留为后续子节点候选。

## 化学

化学目录使用 [ACS 本科化学课程要求](https://www.acs.org/education/policies/acs-approval-program/guidelines/coursework.html) 建立分析、生物化学、无机、有机和物理化学五大主干。[IUPAC 化学分部](https://iupac.org/who-we-are/divisions/) 用于检查聚合物、环境、健康、命名和结构表示的专业边界。[RSC 化学课程框架](https://www.rsc.org/policy-and-campaigning/policy-library/answering-the-big-questions-our-chemistry-curriculum-in-detail) 用组成、结构、性质、反应、能量、速率、平衡、合成和分析检查基础层。[MIT Chemistry Subjects](https://catalog.mit.edu/schools/science/chemistry/) 用于校准配位、金属有机、固态材料、光谱、电化学和计算方向的进阶层级。

化学目录包含七个分支簇：

- 化学基础与共同语言，9 个节点。
- 物理与理论化学，8 个节点。
- 有机、合成与分子设计，7 个节点。
- 无机、固体与材料，8 个节点。
- 分析、测量与数据，5 个节点。
- 生物、药物与健康，6 个节点。
- 环境、可持续与计算，3 个节点。

化学信息学、过程化学、食品化学、地球化学、光化学和表面化学保留为后续子节点候选。

## 生物

生物目录使用 [AP Biology](https://apcentral.collegeboard.org/courses/ap-biology) 和 [OpenStax Biology 2e](https://openstax.org/books/biology-2e/pages/preface) 建立生命化学、细胞、遗传、进化、生物多样性、个体系统与生态的基础顺序。[NCES CIP 26 Biological and Biomedical Sciences](https://nces.ed.gov/ipeds/cipcode/cipdetail.aspx?cipid=88385&y=55) 用于检查专业分支覆盖。NSF 的 [Molecular and Cellular Biosciences](https://www.nsf.gov/funding/opportunities/mcb-division-molecular-cellular-biosciences-core-programs)、[Integrative Organismal Systems](https://www.nsf.gov/bio/ios/about) 和 [Environmental Biology](https://www.nsf.gov/bio/deb/about) 用于补充分子、细胞、个体、种群、群落和生态系统尺度。[Gene Ontology](https://www.geneontology.org/docs/ontology-documentation/) 支持多父节点、多标签和跨簇关系的数据表达。

生物目录包含七个分支簇：

- 分子结构与细胞功能，12 个节点。
- 发育与个体系统，9 个节点。
- 生物多样性与微生物，5 个节点。
- 进化与系统学，4 个节点。
- 生态与保护，6 个节点。
- 宿主、防御与疾病，4 个节点。
- 定量与工程生物学，6 个节点。

海洋生物学、古生物学、药理学和医学诊疗保留为后续子节点候选。

## 关系与层级规则

严格前置只记录稳定的学习依赖，并参与知识球径向深度计算。可并行学习、高校间存在顺序差异或只能提高理解效率的关系记录为推荐前置。应用、共享模型、类比和历史关系只影响邻近、视觉显著性和关系浏览。

领域总览节点可以与专业分支同时存在。典型组合包括凝聚态物理与固体物理，有机化学与有机反应机理，生态学与种群、群落、生态系统生态学。总览节点提供领域入口，专业节点提供后续钻取锚点。
