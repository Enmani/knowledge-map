import { buildCatalog } from './helpers'

const computerScienceCatalog = buildCatalog([
  {
    id: 'computational-thinking', title: '计算思维', englishTitle: 'Computational Thinking',
    summary: '把问题拆解为可表示、可自动执行和可验证的步骤。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics'], tags: ['基础语言', '抽象', '计算方法'], level: 0, importance: 1.25, recommended: ['mathematical-logic'],
  },
  {
    id: 'programming-fundamentals', title: '程序设计基础', englishTitle: 'Programming Fundamentals',
    summary: '用变量、控制流、函数和模块把算法表达为可运行程序。',
    primaryDomain: 'computer-science', tags: ['编程', '基础语言', '计算方法'], level: 0, importance: 1.3, strict: ['computational-thinking'],
  },
  {
    id: 'object-oriented-programming', title: '面向对象程序设计', englishTitle: 'Object-Oriented Programming',
    summary: '用对象、封装、继承和组合组织可演化的软件状态与行为。',
    primaryDomain: 'computer-science', tags: ['编程', '抽象', '软件'], level: 1, strict: ['programming-fundamentals'],
  },
  {
    id: 'functional-programming', title: '函数式程序设计', englishTitle: 'Functional Programming',
    summary: '以纯函数、不可变数据、高阶函数和类型组合程序。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics'], tags: ['编程', '抽象', '形式语言'], level: 2, strict: ['programming-fundamentals'], recommended: ['functions', 'mathematical-logic'],
  },
  {
    id: 'data-structures', title: '数据结构', englishTitle: 'Data Structures',
    summary: '研究数组、链表、树、图、哈希表等数据组织及其操作成本。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics'], tags: ['算法', '离散结构', '编程'], level: 1, importance: 1.25, strict: ['programming-fundamentals'], recommended: ['discrete-math'],
  },
  {
    id: 'algorithm-engineering-experimentation', title: '算法工程与实验分析', englishTitle: 'Algorithm Engineering & Experimentation',
    summary: '把抽象算法实现、剖析并基准测试，在真实数据与硬件约束下比较性能。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics'], tags: ['算法', '性能', '实验方法'], level: 3, importance: 1.15, strict: ['algorithms', 'programming-fundamentals'], recommended: ['data-structures', 'statistics'],
  },
  {
    id: 'automata-formal-languages', title: '自动机与形式语言', englishTitle: 'Automata & Formal Languages',
    summary: '用自动机、文法和语言层次刻画计算过程与符号结构。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics'], tags: ['计算理论', '形式语言', '离散结构'], level: 2, strict: ['discrete-math'], recommended: ['mathematical-logic'],
  },
  {
    id: 'computational-complexity-theory', title: '计算复杂性理论', englishTitle: 'Computational Complexity Theory',
    summary: '研究问题所需时间与空间资源，以及复杂度类之间的边界。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics'], tags: ['计算理论', '复杂度', '证明推理'], level: 3, importance: 1.15, strict: ['algorithms', 'automata-formal-languages'], recommended: ['theory-of-computation'],
  },
  {
    id: 'software-engineering', title: '软件工程', englishTitle: 'Software Engineering',
    summary: '以需求、设计、版本协作和持续交付管理复杂软件的完整生命周期。',
    primaryDomain: 'computer-science', tags: ['软件', '工程方法', '系统'], level: 1, importance: 1.2, strict: ['programming-fundamentals'],
  },
  {
    id: 'software-architecture', title: '软件架构', englishTitle: 'Software Architecture',
    summary: '通过组件、接口、依赖和质量属性设计大型软件系统的整体结构。',
    primaryDomain: 'computer-science', tags: ['软件', '系统', '抽象'], level: 3, strict: ['software-engineering', 'object-oriented-programming'],
  },
  {
    id: 'software-testing-quality', title: '软件测试与质量保障', englishTitle: 'Software Testing & Quality Assurance',
    summary: '用测试设计、自动化、静态分析和质量度量降低软件缺陷风险。',
    primaryDomain: 'computer-science', tags: ['软件', '验证', '工程方法'], level: 2, strict: ['software-engineering'], recommended: ['statistics'],
  },
  {
    id: 'programming-languages', title: '程序设计语言', englishTitle: 'Programming Languages',
    summary: '研究语法、语义、类型系统、求值策略与语言抽象机制。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics'], tags: ['编程', '形式语言', '抽象'], level: 3, strict: ['object-oriented-programming', 'functional-programming'], recommended: ['automata-formal-languages'],
  },
  {
    id: 'compiler-construction', title: '编译原理', englishTitle: 'Compiler Construction',
    summary: '把源程序经过词法语法分析、中间表示和优化转换为可执行代码。',
    primaryDomain: 'computer-science', tags: ['编程', '形式语言', '系统'], level: 3, strict: ['programming-languages', 'automata-formal-languages'], recommended: ['computer-architecture'],
  },
  {
    id: 'formal-methods-verification', title: '形式化方法与程序验证', englishTitle: 'Formal Methods & Program Verification',
    summary: '用形式规约、模型检测和定理证明验证软硬件行为。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics'], tags: ['验证', '形式语言', '证明推理'], level: 4, strict: ['programming-languages', 'automata-formal-languages'], recommended: ['mathematical-logic', 'software-testing-quality'],
  },
  {
    id: 'web-application-engineering', title: 'Web应用工程', englishTitle: 'Web Application Engineering',
    summary: '整合客户端、服务端、接口、数据与部署构建网络应用。',
    primaryDomain: 'computer-science', tags: ['软件', '网络', '系统'], level: 3, strict: ['software-engineering', 'computer-networks', 'database-systems'], recommended: ['computer-security'],
  },
  {
    id: 'human-computer-interaction', title: '人机交互', englishTitle: 'Human–Computer Interaction',
    summary: '研究交互设计、可用性、认知负荷与以用户为中心的评估方法。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'biology'], tags: ['交互', '设计', '实验方法'], level: 2, strict: ['software-engineering'], recommended: ['statistics', 'neuroscience'],
  },
  {
    id: 'digital-logic-design', title: '数字逻辑与电路设计', englishTitle: 'Digital Logic & Circuit Design',
    summary: '用布尔逻辑、组合电路和时序电路构造数字计算部件。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'physics', 'mathematics'], tags: ['硬件', '离散结构', '信息'], level: 1, importance: 1.15, strict: ['computational-thinking'], recommended: ['mathematical-logic', 'electromagnetism'],
  },
  {
    id: 'computer-architecture', title: '计算机组成与体系结构', englishTitle: 'Computer Organization & Architecture',
    summary: '研究处理器、存储层次、指令集和输入输出如何协同执行程序。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'physics'], tags: ['硬件', '系统', '性能'], level: 2, importance: 1.25, strict: ['digital-logic-design', 'programming-fundamentals'],
  },
  {
    id: 'operating-systems', title: '操作系统', englishTitle: 'Operating Systems',
    summary: '管理进程、内存、文件、设备和并发，为程序提供抽象与隔离。',
    primaryDomain: 'computer-science', tags: ['系统', '并发', '资源管理'], level: 3, importance: 1.25, strict: ['computer-architecture', 'data-structures'],
  },
  {
    id: 'computer-networks', title: '计算机网络', englishTitle: 'Computer Networks',
    summary: '研究分层协议、路由、拥塞控制和端到端数据传输。',
    primaryDomain: 'computer-science', tags: ['网络', '协议', '系统'], level: 2, importance: 1.25, strict: ['programming-fundamentals'], recommended: ['graph-theory', 'probability'],
  },
  {
    id: 'distributed-systems', title: '分布式系统', englishTitle: 'Distributed Systems',
    summary: '在部分故障和并发条件下协调多台计算机实现一致、可用的服务。',
    primaryDomain: 'computer-science', tags: ['系统', '网络', '并发'], level: 3, importance: 1.2, strict: ['computer-networks', 'operating-systems', 'algorithms'], recommended: ['algorithm-engineering-experimentation'],
  },
  {
    id: 'parallel-high-performance-computing', title: '并行与高性能计算', englishTitle: 'Parallel & High-Performance Computing',
    summary: '利用多核、加速器和集群并行求解计算密集型问题。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics', 'physics'], tags: ['并发', '性能', '计算方法'], level: 3, strict: ['computer-architecture', 'algorithms'], recommended: ['algorithm-engineering-experimentation', 'linear-algebra', 'operating-systems'],
  },
  {
    id: 'database-systems', title: '数据库系统', englishTitle: 'Database Systems',
    summary: '用数据模型、查询、索引、事务和恢复可靠地组织持久数据。',
    primaryDomain: 'computer-science', tags: ['数据', '系统', '信息'], level: 2, importance: 1.2, strict: ['data-structures'], recommended: ['set-theory'],
  },
  {
    id: 'data-intensive-systems', title: '数据密集型系统', englishTitle: 'Data-Intensive Systems',
    summary: '研究大规模数据的复制、分区、流处理和一致性权衡。',
    primaryDomain: 'computer-science', tags: ['数据', '分布式', '系统'], level: 4, strict: ['database-systems', 'distributed-systems'],
  },
  {
    id: 'cloud-computing', title: '云计算', englishTitle: 'Cloud Computing',
    summary: '以虚拟化、容器、弹性调度和服务化交付共享计算资源。',
    primaryDomain: 'computer-science', tags: ['系统', '分布式', '工程方法'], level: 4, strict: ['distributed-systems', 'data-intensive-systems'], recommended: ['computer-security'],
  },
  {
    id: 'embedded-systems', title: '嵌入式系统', englishTitle: 'Embedded Systems',
    summary: '把软硬件协同设计用于资源受限、实时和专用的计算设备。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'physics'], tags: ['硬件', '系统', '实时计算'], level: 3, strict: ['computer-architecture', 'programming-fundamentals'], recommended: ['operating-systems'],
  },
  {
    id: 'internet-of-things', title: '物联网', englishTitle: 'Internet of Things',
    summary: '连接传感器、边缘设备和云服务以感知并控制物理环境。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'physics'], tags: ['网络', '硬件', '系统'], level: 4, strict: ['embedded-systems', 'computer-networks'], recommended: ['cloud-computing', 'computer-security'],
  },
  {
    id: 'computer-security', title: '计算机与网络安全', englishTitle: 'Computer & Network Security',
    summary: '分析威胁、漏洞、访问控制和防御机制以保护系统与数据。',
    primaryDomain: 'computer-science', tags: ['安全', '网络', '系统'], level: 3, importance: 1.2, strict: ['operating-systems', 'computer-networks', 'software-engineering'],
  },
  {
    id: 'applied-cryptography', title: '应用密码学', englishTitle: 'Applied Cryptography',
    summary: '把加密、认证、密钥交换和协议安全落实到真实计算系统。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics'], tags: ['安全', '信息', '协议'], level: 4, strict: ['computer-security'], recommended: ['cryptography', 'number-theory'],
  },
  {
    id: 'artificial-intelligence', title: '人工智能', englishTitle: 'Artificial Intelligence',
    summary: '研究搜索、规划、学习和推理，使系统能够感知环境并采取行动。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics'], tags: ['智能', '算法', '建模'], level: 3, importance: 1.25, strict: ['algorithms'], recommended: ['probability', 'optimization'],
  },
  {
    id: 'knowledge-representation-reasoning', title: '知识表示与推理', englishTitle: 'Knowledge Representation & Reasoning',
    summary: '用逻辑、知识图谱和不确定推理表达世界并导出新结论。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics'], tags: ['智能', '知识', '推理'], level: 4, strict: ['artificial-intelligence'], recommended: ['mathematical-logic', 'graph-theory', 'probability'],
  },
  {
    id: 'machine-learning-systems', title: '机器学习系统', englishTitle: 'Machine Learning Systems',
    summary: '将数据、训练、部署、监控与反馈组织成可靠可扩展的学习系统。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics'], tags: ['智能', '数据', '工程方法'], level: 4, importance: 1.2, strict: ['machine-learning', 'software-engineering'], recommended: ['distributed-systems'],
  },
  {
    id: 'deep-learning', title: '深度学习', englishTitle: 'Deep Learning',
    summary: '用多层神经网络学习数据的分层表示与复杂预测函数。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics'], tags: ['智能', '数据', '最优化'], level: 4, importance: 1.2, strict: ['machine-learning'], recommended: ['linear-algebra', 'optimization', 'parallel-high-performance-computing'],
  },
  {
    id: 'natural-language-processing', title: '自然语言处理', englishTitle: 'Natural Language Processing',
    summary: '让计算机分析、生成和交互使用人类语言。',
    primaryDomain: 'computer-science', tags: ['智能', '语言', '数据'], level: 4, strict: ['artificial-intelligence'], recommended: ['deep-learning', 'automata-formal-languages', 'statistics'],
  },
  {
    id: 'computer-vision', title: '计算机视觉', englishTitle: 'Computer Vision',
    summary: '从图像与视频中恢复结构、识别对象并理解动态场景。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics', 'physics'], tags: ['智能', '成像', '数据'], level: 4, strict: ['artificial-intelligence'], recommended: ['deep-learning', 'linear-algebra', 'optics', 'probability'],
  },
  {
    id: 'reinforcement-learning', title: '强化学习', englishTitle: 'Reinforcement Learning',
    summary: '研究智能体如何通过试错和延迟回报学习序贯决策策略。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics'], tags: ['智能', '决策', '不确定性'], level: 4, strict: ['machine-learning', 'artificial-intelligence'], recommended: ['probability', 'dynamical-systems', 'optimization'],
  },
  {
    id: 'multi-agent-systems', title: '多智能体系统', englishTitle: 'Multi-Agent Systems',
    summary: '研究多个自主智能体之间的协作、竞争、通信与集体行为。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics', 'biology'], tags: ['智能', '系统', '决策'], level: 4, strict: ['artificial-intelligence'], recommended: ['game-theory', 'reinforcement-learning'],
  },
  {
    id: 'data-science', title: '数据科学', englishTitle: 'Data Science',
    summary: '整合计算、统计和领域知识完成数据清理、探索、建模与沟通。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics'], tags: ['数据', '统计', '建模'], level: 3, importance: 1.15, strict: ['programming-fundamentals', 'statistics'], recommended: ['database-systems'],
  },
  {
    id: 'data-mining', title: '数据挖掘', englishTitle: 'Data Mining',
    summary: '从大规模数据中发现模式、异常、群组和关联结构。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics'], tags: ['数据', '算法', '数据推断'], level: 4, strict: ['data-science', 'database-systems'], recommended: ['machine-learning'],
  },
  {
    id: 'information-retrieval', title: '信息检索', englishTitle: 'Information Retrieval',
    summary: '对文档与多媒体建立索引、排序和相关性评估，以响应信息需求。',
    primaryDomain: 'computer-science', tags: ['信息', '数据', '算法'], level: 3, strict: ['data-structures', 'probability'], recommended: ['natural-language-processing', 'database-systems'],
  },
  {
    id: 'computer-graphics', title: '计算机图形学', englishTitle: 'Computer Graphics',
    summary: '用几何、光照、动画和渲染算法生成与操控视觉场景。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics', 'physics'], tags: ['成像', '空间形态', '算法'], level: 3, strict: ['data-structures', 'linear-algebra'], recommended: ['vector-geometry', 'optics'],
  },
  {
    id: 'robotics-autonomous-systems', title: '机器人与自主系统', englishTitle: 'Robotics & Autonomous Systems',
    summary: '融合感知、规划、控制和嵌入式计算，使机器在物理世界自主行动。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'physics', 'mathematics'], tags: ['智能', '控制', '硬件'], level: 4, importance: 1.15, strict: ['artificial-intelligence', 'embedded-systems'], recommended: ['control-theory', 'computer-vision'],
  },
  {
    id: 'scientific-computing', title: '科学计算', englishTitle: 'Scientific Computing',
    summary: '用数值算法、模拟和高性能计算研究自然与工程系统。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics', 'physics', 'chemistry', 'biology'], tags: ['计算方法', '建模', '跨学科'], level: 3, importance: 1.15, strict: ['algorithms', 'numerical-analysis'], recommended: ['algorithm-engineering-experimentation', 'parallel-high-performance-computing'],
  },
  {
    id: 'quantum-computing', title: '量子计算', englishTitle: 'Quantum Computing',
    summary: '利用叠加、纠缠和量子门设计信息处理模型与算法。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'physics', 'mathematics'], tags: ['计算理论', '量子', '信息'], level: 4, importance: 1.15, strict: ['algorithms', 'quantum-information'], recommended: ['linear-algebra', 'applied-cryptography'],
  },
  {
    id: 'privacy-preserving-computing', title: '隐私保护计算', englishTitle: 'Privacy-Preserving Computing',
    summary: '用差分隐私、安全多方计算和同态加密降低数据使用中的泄露风险。',
    primaryDomain: 'computer-science', domains: ['computer-science', 'mathematics'], tags: ['安全', '隐私', '数据'], level: 4, strict: ['computer-security', 'statistics'], recommended: ['applied-cryptography'],
  },
  {
    id: 'computing-ethics-society', title: '计算伦理与社会', englishTitle: 'Computing Ethics & Society',
    summary: '审视计算技术的公平、责任、隐私、可持续性和社会制度影响。',
    primaryDomain: 'computer-science', tags: ['伦理', '社会影响', '责任'], level: 1, importance: 1.1, strict: ['computational-thinking'], recommended: ['human-computer-interaction', 'artificial-intelligence', 'privacy-preserving-computing'],
  },
] as const)

export const computerScienceNodes = computerScienceCatalog.nodes
export const computerScienceEdges = computerScienceCatalog.edges
