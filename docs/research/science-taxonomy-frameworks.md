# 理科领域分类依据

三维公共知识空间收录数学、物理、化学、生物、计算机科学、地球与环境科学各 46 个主节点，共 276 个。单个主节点对应一门课程的核心模块或一个可独立继续深入的专业方向。前四个目录使用下列公开分类和课程框架校准；计算机科学与地球环境目录的本轮分支总结直接依据仓库中的实际节点与前置关系，不为它们补写未经核验的外部来源。

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

## 计算机科学

计算机科学目录位于 `src/knowledge/space3d/catalog/computerScience.ts`，从计算思维与编程基础展开，连接软件、硬件、系统、数据、智能及计算技术的社会责任。数学目录已经收录的算法、理论计算机科学、机器学习和现代密码学作为共享基础或推荐前置保留；本目录使用更具体的计算机系统与工程节点，避免复制相同稳定 ID。

按目录中的 46 个实际节点归纳为六个分支簇：

- 计算思维、编程、数据结构、算法、自动机与复杂性，8 个节点。
- 软件工程、软件架构、测试、程序语言、编译、形式验证、Web 与人机交互，8 个节点。
- 数字逻辑、体系结构、操作系统、网络、分布式与高性能计算，6 个节点。
- 数据库、数据密集型与云计算、嵌入式、物联网、安全和应用密码，7 个节点。
- 人工智能、知识表示、机器学习系统、深度学习、语言、视觉、强化学习、多智能体与数据分析，11 个节点。
- 图形学、机器人、科学计算、量子计算、隐私保护和计算伦理，6 个节点。

移动计算、区块链、边缘计算、可访问性工程和专用芯片可在后续作为子节点或跨领域应用补充。

## 地球与环境科学

地球与环境科学目录位于 `src/knowledge/space3d/catalog/earthEnvironmental.ts`，以地球系统为入口，把固体地球、大气、海洋、水文、冰冻圈、生物地球化学、气候、环境风险和可持续性组织为一张相互耦合的图。大量节点同时归属于物理、化学、生物或数学，用于表达地球过程依赖的跨学科机制。

按目录中的 46 个实际节点归纳为六个分支簇：

- 地球系统、野外与空间观测、地球历史和行星比较，5 个节点。
- 矿物岩石、沉积地层、构造地貌、古生态、资源与土壤，10 个节点。
- 地球物理、地震、内部动力、地磁、大地测量、地球化学与生物地球化学，8 个节点。
- 大气、大气动力与化学、天气、海洋、物理海洋和海洋生物地球化学，7 个节点。
- 水文、地下水、流域、冰冻圈、气候系统、古气候、气候建模与影响，8 个节点。
- 环境科学、监测、污染修复、健康风险、景观保护、灾害风险和可持续资源系统，8 个节点。

火山学、海岸科学、城市气候、环境经济与治理可以在后续作为子节点扩展；新增时应继续连接实际依赖的物理、化学、生物、数学和计算节点。

## 关系与层级规则

严格前置只记录稳定的学习依赖，并参与最长前置深度和基础性半径计算。可并行学习、高校间存在顺序差异或只能提高理解效率的关系记录为推荐前置。严格与推荐前置、应用、共享模型、类比和历史关系均按类型与强度参与关系亲和度；标签相似和领域相似只提供较弱的聚集先验。完整布局规则见 [ADR-003：关系驱动语义布局](../architecture/ADR-003-relationship-driven-semantic-layout.md)。

领域总览节点可以与专业分支同时存在。典型组合包括凝聚态物理与固体物理，有机化学与有机反应机理，生态学与种群、群落、生态系统生态学。总览节点提供领域入口，专业节点提供后续钻取锚点。
