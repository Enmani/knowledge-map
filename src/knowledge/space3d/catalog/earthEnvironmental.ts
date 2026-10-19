import { buildCatalog } from './helpers'

const earthEnvironmentalCatalog = buildCatalog([
  {
    id: 'earth-system-science', title: '地球系统科学', englishTitle: 'Earth System Science',
    summary: '把岩石圈、水圈、大气圈、冰冻圈、生物圈和人类活动视为相互耦合的整体。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics', 'chemistry', 'biology'], tags: ['地球系统', '跨学科', '基础语言'], level: 0, importance: 1.3, recommended: ['measurement-units', 'mathematical-modeling'],
  },
  {
    id: 'earth-field-methods', title: '地球科学野外方法', englishTitle: 'Earth Science Field Methods',
    summary: '通过野外观测、采样、测绘和记录获取可定位、可复核的地球科学证据。',
    primaryDomain: 'earth-environmental', tags: ['观测', '测量', '野外'], level: 1, importance: 1.05, strict: ['earth-system-science', 'measurement-units'], recommended: ['experimental-methods'],
  },
  {
    id: 'earth-observation-geospatial', title: '地球观测与地理空间分析', englishTitle: 'Earth Observation & Geospatial Analysis',
    summary: '利用遥感、定位、地图和空间数据描述地表格局及其随时间的变化。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'mathematics', 'physics'], tags: ['观测', '空间', '数据'], level: 2, importance: 1.2, strict: ['earth-system-science', 'measurement-units'], recommended: ['statistics', 'optics'],
  },
  {
    id: 'geologic-time-earth-history', title: '地质年代与地球历史', englishTitle: 'Geologic Time & Earth History',
    summary: '用相对年代、绝对定年和地层记录重建地球长期演化的时间框架。',
    primaryDomain: 'earth-environmental', tags: ['深时', '演化', '证据'], level: 1, importance: 1.2, strict: ['earth-system-science'], recommended: ['evolution', 'nuclear-radiochemistry'],
  },
  {
    id: 'planetary-earth-science', title: '行星地球科学', englishTitle: 'Planetary Earth Science',
    summary: '比较地球与其他行星的形成、内部、表面和大气，理解地球的共同规律与特殊性。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics', 'chemistry'], tags: ['行星', '演化', '比较'], level: 2, strict: ['earth-system-science'], recommended: ['astrophysics', 'geologic-time-earth-history'],
  },
  {
    id: 'earth-mineralogy', title: '矿物学', englishTitle: 'Mineralogy',
    summary: '研究矿物的晶体结构、成分、物性、形成条件及其鉴定方法。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'chemistry'], tags: ['固体地球', '物质', '结构'], level: 2, importance: 1.15, strict: ['earth-system-science', 'atomic-structure'], recommended: ['chemical-bonding', 'solid-state-chemistry'],
  },
  {
    id: 'earth-petrology', title: '岩石学', englishTitle: 'Petrology',
    summary: '研究火成岩、沉积岩和变质岩的组成、结构、成因与转化。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'chemistry'], tags: ['固体地球', '岩石循环', '物质'], level: 2, importance: 1.15, strict: ['earth-mineralogy'], recommended: ['thermodynamics', 'chemical-equilibrium'],
  },
  {
    id: 'sedimentology', title: '沉积学', englishTitle: 'Sedimentology',
    summary: '研究沉积物的产生、搬运、沉积和成岩过程及其环境记录。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics'], tags: ['地表过程', '物质运输', '证据'], level: 2, strict: ['earth-system-science'], recommended: ['earth-field-methods', 'fluid-dynamics'],
  },
  {
    id: 'stratigraphy', title: '地层学', englishTitle: 'Stratigraphy',
    summary: '依据岩层顺序、岩性、化石和年代标志关联地层并重建沉积历史。',
    primaryDomain: 'earth-environmental', tags: ['深时', '地层', '证据'], level: 3, strict: ['sedimentology', 'geologic-time-earth-history'], recommended: ['earth-field-methods'],
  },
  {
    id: 'structural-geology-tectonics', title: '构造地质与岩石变形', englishTitle: 'Structural Geology & Rock Deformation',
    summary: '研究岩石变形、断层、褶皱和区域构造所记录的应力与运动。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics'], tags: ['固体地球', '变形', '动力系统'], level: 2, importance: 1.15, strict: ['earth-system-science', 'classical-mechanics'], recommended: ['continuum-mechanics', 'earth-field-methods'],
  },
  {
    id: 'plate-tectonics', title: '板块构造', englishTitle: 'Plate Tectonics',
    summary: '以岩石圈板块的生成、运动和消亡统一解释造山、地震、火山与洋盆演化。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics'], tags: ['固体地球', '动力系统', '统一理论'], level: 3, importance: 1.3, strict: ['structural-geology-tectonics', 'earth-petrology'], recommended: ['geologic-time-earth-history'],
  },
  {
    id: 'volcanology', title: '火山学', englishTitle: 'Volcanology',
    summary: '研究岩浆的形成与上升、喷发动力、火山产物、监测证据及其对环境和灾害的影响。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics', 'chemistry'], tags: ['固体地球', '能量', '风险'], level: 3, importance: 1.15, strict: ['earth-petrology', 'plate-tectonics'], recommended: ['fluid-dynamics', 'earth-geochemistry', 'experimental-methods'],
  },
  {
    id: 'geomorphology', title: '地貌学', englishTitle: 'Geomorphology',
    summary: '研究构造、风化、侵蚀、搬运和沉积如何塑造并改变地表形态。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics'], tags: ['地表过程', '地形', '演化'], level: 3, importance: 1.1, strict: ['sedimentology', 'structural-geology-tectonics'], recommended: ['earth-observation-geospatial'],
  },
  {
    id: 'paleontology-paleoecology', title: '古生物学', englishTitle: 'Paleontology',
    summary: '利用化石的形态、埋藏、年代与系统关系研究古代生命的多样性和演化。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'biology'], tags: ['深时', '生命', '演化'], level: 3, strict: ['geologic-time-earth-history', 'evolution'], recommended: ['stratigraphy', 'ecology'],
  },
  {
    id: 'paleoecology', title: '古生态学', englishTitle: 'Paleoecology',
    summary: '综合化石组合、沉积环境和地球化学代用指标重建古代群落、食物网与生态环境。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'biology', 'chemistry'], tags: ['深时', '生态', '证据'], level: 4, strict: ['paleontology-paleoecology', 'ecology'], recommended: ['stratigraphy', 'earth-geochemistry'],
  },
  {
    id: 'economic-geology-resources', title: '经济地质与矿产资源', englishTitle: 'Economic Geology & Mineral Resources',
    summary: '研究矿床的形成、勘查、评价与负责任开发所需的地质条件。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'chemistry'], tags: ['资源', '固体地球', '应用'], level: 3, strict: ['earth-mineralogy', 'earth-petrology'], recommended: ['earth-observation-geospatial', 'plate-tectonics'],
  },
  {
    id: 'soil-science', title: '土壤科学', englishTitle: 'Soil Science',
    summary: '研究土壤的形成、结构、肥力、水分、碳储量及其生态功能。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'chemistry', 'biology'], tags: ['土壤', '生态', '地表过程'], level: 2, importance: 1.15, strict: ['earth-mineralogy'], recommended: ['ecosystem-ecology', 'geomorphology', 'environmental-chemistry'],
  },
  {
    id: 'geophysics', title: '地球物理学', englishTitle: 'Geophysics',
    summary: '用力学、波、热、电磁和重力观测反演地球内部与地表过程。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics', 'mathematics'], tags: ['固体地球', '测量', '反演'], level: 2, importance: 1.2, strict: ['earth-system-science', 'classical-mechanics'], recommended: ['waves-oscillations', 'differential-equations'],
  },
  {
    id: 'seismology', title: '地震学', englishTitle: 'Seismology',
    summary: '研究地震波、震源过程和地球介质结构，并评估地震活动特征。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics'], tags: ['波', '固体地球', '风险'], level: 3, importance: 1.2, strict: ['geophysics', 'waves-oscillations'], recommended: ['statistics'],
  },
  {
    id: 'earth-interior-dynamics', title: '地球内部与地球动力学', englishTitle: 'Earth Interior & Geodynamics',
    summary: '研究地核、地幔和地壳的结构、热演化、对流及其对板块运动的驱动。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics', 'chemistry'], tags: ['固体地球', '能量', '动力系统'], level: 4, importance: 1.2, strict: ['geophysics', 'earth-mineralogy', 'thermodynamics'], recommended: ['plate-tectonics', 'fluid-dynamics'],
  },
  {
    id: 'geomagnetism-space-weather', title: '地磁学与古地磁学', englishTitle: 'Geomagnetism & Paleomagnetism',
    summary: '研究地磁场的产生和长期变化，以及岩石磁性记录如何保存板块运动与地球历史。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics'], tags: ['场', '深时', '观测'], level: 4, strict: ['geophysics', 'electromagnetism'], recommended: ['earth-interior-dynamics', 'earth-petrology'],
  },
  {
    id: 'space-physics-space-weather', title: '空间物理与空间天气', englishTitle: 'Space Physics & Space Weather',
    summary: '研究太阳风、磁层、电离层和近地等离子体的耦合，以及空间环境变化对技术系统的影响。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics'], tags: ['场', '等离子体', '风险'], level: 4, strict: ['electromagnetism', 'plasma-physics'], recommended: ['geomagnetism-space-weather', 'astrophysics', 'earth-observation-geospatial'],
  },
  {
    id: 'geodesy-gravity-field', title: '大地测量与重力场', englishTitle: 'Geodesy & Gravity Field',
    summary: '精密测量地球形状、姿态、形变和重力场，并追踪质量重新分配。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics', 'mathematics'], tags: ['测量', '空间', '反演'], level: 3, strict: ['geophysics', 'measurement-units'], recommended: ['linear-algebra', 'earth-observation-geospatial'],
  },
  {
    id: 'earth-geochemistry', title: '地球化学', englishTitle: 'Geochemistry',
    summary: '研究元素和同位素在地球各圈层中的分布、反应、迁移与循环。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'chemistry'], tags: ['物质循环', '反应', '固体地球'], level: 2, importance: 1.2, strict: ['earth-mineralogy', 'chemical-equilibrium'], recommended: ['analytical-chemistry'],
  },
  {
    id: 'isotope-geochemistry-geochronology', title: '同位素地球化学与年代学', englishTitle: 'Isotope Geochemistry & Geochronology',
    summary: '利用放射性衰变和稳定同位素分馏约束年代、来源和地球过程。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'chemistry', 'physics'], tags: ['同位素', '深时', '测量'], level: 4, strict: ['earth-geochemistry', 'geologic-time-earth-history', 'nuclear-radiochemistry'], recommended: ['mass-spectrometry', 'statistics'],
  },
  {
    id: 'biogeochemistry', title: '生物地球化学', englishTitle: 'Biogeochemistry',
    summary: '研究生命活动与地质、化学过程共同控制的碳、氮、磷等元素循环。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'chemistry', 'biology'], tags: ['物质循环', '生态', '跨学科'], level: 3, importance: 1.25, strict: ['earth-geochemistry', 'ecosystem-ecology'], recommended: ['microbiology'],
  },
  {
    id: 'atmospheric-science', title: '大气科学', englishTitle: 'Atmospheric Science',
    summary: '研究大气的组成、结构、辐射、运动以及它与地表和太空的交换。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics', 'chemistry'], tags: ['大气', '地球系统', '能量'], level: 2, importance: 1.2, strict: ['earth-system-science', 'thermodynamics'], recommended: ['fluid-dynamics'],
  },
  {
    id: 'atmospheric-dynamics', title: '大气动力学', englishTitle: 'Atmospheric Dynamics',
    summary: '用旋转流体、守恒定律和尺度分析解释大气环流、波动与不稳定性。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics', 'mathematics'], tags: ['大气', '流体', '动力系统'], level: 3, strict: ['atmospheric-science', 'fluid-dynamics'], recommended: ['differential-equations'],
  },
  {
    id: 'atmospheric-chemistry', title: '大气化学', englishTitle: 'Atmospheric Chemistry',
    summary: '研究大气成分的排放、光化学反应、输送、沉降及其空气质量效应。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'chemistry'], tags: ['大气', '反应', '污染'], level: 3, strict: ['atmospheric-science', 'environmental-chemistry'], recommended: ['chemical-kinetics', 'spectroscopy'],
  },
  {
    id: 'meteorology-weather', title: '气象学与天气预报', englishTitle: 'Meteorology & Weather Forecasting',
    summary: '综合观测、动力过程和数值模型分析天气系统并作出概率预报。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics', 'mathematics'], tags: ['大气', '预测', '数据'], level: 4, importance: 1.15, strict: ['atmospheric-dynamics', 'earth-observation-geospatial'], recommended: ['statistics', 'numerical-analysis'],
  },
  {
    id: 'oceanography', title: '海洋科学', englishTitle: 'Oceanography',
    summary: '研究海洋的物理、化学、地质和生物过程及其在地球系统中的作用。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics', 'chemistry', 'biology'], tags: ['海洋', '地球系统', '跨学科'], level: 2, importance: 1.2, strict: ['earth-system-science'], recommended: ['fluid-dynamics', 'ecosystem-ecology'],
  },
  {
    id: 'physical-oceanography', title: '物理海洋学', englishTitle: 'Physical Oceanography',
    summary: '研究海流、潮汐、波浪、海洋分层和海气之间的动量与热量交换。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics', 'mathematics'], tags: ['海洋', '流体', '能量'], level: 3, strict: ['oceanography', 'fluid-dynamics'], recommended: ['differential-equations'],
  },
  {
    id: 'marine-biogeochemistry', title: '海洋生物地球化学', englishTitle: 'Marine Biogeochemistry',
    summary: '研究海洋中的营养盐、碳循环、生物泵和氧化还原环境。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'chemistry', 'biology'], tags: ['海洋', '物质循环', '生态'], level: 4, strict: ['oceanography', 'biogeochemistry'], recommended: ['environmental-chemistry'],
  },
  {
    id: 'hydrology', title: '水文学', englishTitle: 'Hydrology',
    summary: '研究降水、蒸散、径流、入渗和储水在陆地水循环中的分配与变化。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics', 'mathematics'], tags: ['水循环', '地表过程', '系统'], level: 2, importance: 1.2, strict: ['earth-system-science'], recommended: ['fluid-dynamics', 'statistics'],
  },
  {
    id: 'hydrogeology-groundwater', title: '水文地质与地下水', englishTitle: 'Hydrogeology & Groundwater',
    summary: '研究地下水在孔隙和裂隙介质中的储存、流动、补给及污染迁移。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics', 'chemistry'], tags: ['水循环', '地下水', '物质运输'], level: 3, strict: ['hydrology', 'earth-mineralogy'], recommended: ['environmental-chemistry', 'differential-equations'],
  },
  {
    id: 'river-basin-science', title: '河流与流域科学', englishTitle: 'River & Watershed Science',
    summary: '研究流域内水、泥沙、养分与污染物从坡面到河网的输送和管理。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics', 'biology'], tags: ['水循环', '流域', '物质运输'], level: 3, strict: ['hydrology', 'geomorphology'], recommended: ['ecosystem-ecology'],
  },
  {
    id: 'cryosphere-science', title: '冰冻圈科学', englishTitle: 'Cryosphere Science',
    summary: '研究冰川、冰盖、海冰、积雪和冻土的质量平衡、运动及气候反馈。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics'], tags: ['冰冻圈', '气候', '水循环'], level: 3, strict: ['earth-system-science', 'thermodynamics'], recommended: ['fluid-dynamics', 'earth-observation-geospatial'],
  },
  {
    id: 'climate-system', title: '气候系统', englishTitle: 'Climate System',
    summary: '研究大气、海洋、陆面、冰冻圈与生物圈的长期能量平衡、环流和反馈。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics', 'chemistry', 'biology'], tags: ['气候', '反馈', '地球系统'], level: 3, importance: 1.3, strict: ['atmospheric-science', 'oceanography'], recommended: ['cryosphere-science', 'biogeochemistry'],
  },
  {
    id: 'paleoclimatology', title: '古气候学', englishTitle: 'Paleoclimatology',
    summary: '利用冰芯、沉积物、化石和同位素代用指标重建过去气候及其驱动。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'chemistry', 'biology'], tags: ['气候', '深时', '证据'], level: 4, strict: ['climate-system', 'geologic-time-earth-history'], recommended: ['isotope-geochemistry-geochronology', 'stratigraphy'],
  },
  {
    id: 'climate-modeling-prediction', title: '气候建模与预测', englishTitle: 'Climate Modeling & Prediction',
    summary: '用耦合数值模型、情景和集合模拟量化气候变化及其不确定性。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics', 'mathematics'], tags: ['气候', '建模', '不确定性'], level: 4, importance: 1.2, strict: ['climate-system', 'differential-equations', 'statistics'], recommended: ['numerical-analysis', 'physical-oceanography'],
  },
  {
    id: 'climate-change-impacts', title: '气候变化与影响', englishTitle: 'Climate Change & Impacts',
    summary: '研究气候强迫、归因、极端事件和生态社会影响，以及减缓与适应的科学依据。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics', 'chemistry', 'biology'], tags: ['气候', '风险', '应用'], level: 4, importance: 1.3, strict: ['climate-system'], recommended: ['biogeochemistry', 'climate-modeling-prediction', 'paleoclimatology'],
  },
  {
    id: 'environmental-science', title: '环境科学', englishTitle: 'Environmental Science',
    summary: '综合自然科学研究环境质量、生态响应、人类压力与解决方案。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'chemistry', 'biology'], tags: ['环境', '跨学科', '应用'], level: 2, importance: 1.3, strict: ['earth-system-science'], recommended: ['ecology', 'environmental-chemistry', 'statistics'],
  },
  {
    id: 'environmental-monitoring-assessment', title: '环境监测与评价', englishTitle: 'Environmental Monitoring & Assessment',
    summary: '通过采样、传感、遥感、统计和指标体系识别环境状态、趋势与压力来源。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'chemistry', 'mathematics'], tags: ['环境', '测量', '数据'], level: 3, importance: 1.15, strict: ['environmental-science', 'earth-observation-geospatial'], recommended: ['analytical-chemistry', 'statistics'],
  },
  {
    id: 'pollution-fate-remediation', title: '污染物归趋与修复', englishTitle: 'Pollutant Fate & Remediation',
    summary: '研究污染物在空气、水和土壤中的迁移转化、暴露路径及物理化学生物修复。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'chemistry', 'biology'], tags: ['污染', '物质运输', '修复'], level: 4, importance: 1.2, strict: ['environmental-monitoring-assessment', 'environmental-chemistry'], recommended: ['soil-science', 'microbiology'],
  },
  {
    id: 'environmental-risk-health', title: '环境风险与健康', englishTitle: 'Environmental Risk & Health',
    summary: '把危害、暴露、剂量—反应与人群脆弱性联系起来评估环境健康风险。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'chemistry', 'biology', 'mathematics'], tags: ['风险', '健康', '不确定性'], level: 4, strict: ['environmental-monitoring-assessment', 'toxicology', 'statistics'], recommended: ['pollution-fate-remediation', 'epidemiology'],
  },
  {
    id: 'landscape-conservation-science', title: '景观与保护科学', englishTitle: 'Landscape & Conservation Science',
    summary: '研究土地利用、栖息地连通性和人类压力如何影响区域生态过程与生物多样性。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'biology', 'mathematics'], tags: ['生态', '空间', '保护'], level: 4, strict: ['environmental-science', 'biodiversity-conservation'], recommended: ['earth-observation-geospatial', 'biogeography'],
  },
  {
    id: 'natural-hazards-disaster-risk', title: '自然灾害与灾害风险', englishTitle: 'Natural Hazards & Disaster Risk',
    summary: '综合致灾过程、暴露度、脆弱性和预警信息理解并降低复合灾害风险。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'physics', 'mathematics'], tags: ['灾害', '风险', '应用'], level: 4, importance: 1.2, strict: ['earth-observation-geospatial'], recommended: ['seismology', 'volcanology', 'meteorology-weather', 'geomorphology', 'statistics'],
  },
  {
    id: 'sustainability-science', title: '可持续发展科学', englishTitle: 'Sustainability Science',
    summary: '研究自然与人类系统的长期耦合、边界、公平转型和可验证的可持续路径。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'biology', 'chemistry'], tags: ['可持续', '系统', '决策'], level: 3, importance: 1.3, strict: ['environmental-science'], recommended: ['biogeochemistry', 'climate-change-impacts', 'green-sustainable-chemistry'],
  },
  {
    id: 'sustainable-resource-systems', title: '可持续资源系统', englishTitle: 'Sustainable Resource Systems',
    summary: '从生命周期和系统耦合角度协调水、能源、食物、土地与矿产资源的使用和循环。',
    primaryDomain: 'earth-environmental', domains: ['earth-environmental', 'chemistry', 'biology'], tags: ['资源', '可持续', '系统'], level: 4, importance: 1.2, strict: ['sustainability-science', 'economic-geology-resources', 'hydrology'], recommended: ['green-sustainable-chemistry', 'soil-science'],
  },
] as const)

export const earthEnvironmentalNodes = earthEnvironmentalCatalog.nodes
export const earthEnvironmentalEdges = earthEnvironmentalCatalog.edges
