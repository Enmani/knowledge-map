import { DERIVATIVE_TANGENT_WIDGET_ID } from '../widgets/catalog'
import type { KnowledgeCardContent } from './types'

export const calculusContent = {
  id: 'content:calculus',
  conceptId: 'calculus',
  summary: '微积分研究连续变化，以及局部变化与整体累积之间的关系。',
  sections: [
    {
      id: 'calculus-what-is-it',
      title: '什么是微积分',
      paragraphs: [
        '日常生活中，很多计算问题面对的都是确定的数量：一段道路有多长，一块土地有多大，仓库里有多少货物。然而，自然界中还有许多量始终处在变化之中。比如汽车行驶时，位置随时间变化；液体流入容器时，体积不断增加；行星沿轨道运动时，速度的大小和方向也可能同时改变。',
        '对于这类不断变化的量，只知道起点和终点往往是不够的。假设一辆车在两小时内行驶了120公里，我们可以算出它的平均速度是每小时60公里。但是，这个结果无法说明汽车在某一个时刻开得有多快。它可能在高速公路上达到每小时100公里，也可能曾经在路口停下。因此，如果想了解汽车在某一时刻的运动状态，就需要考察这一时刻附近的位置变化。',
        '与此同时，我们也会遇到方向相反的问题。假如已经知道汽车在每个时刻的速度，又该怎样计算整段旅程的位移？如果水流的速度不断变化，一小时后容器里究竟增加了多少水？这些问题都需要根据持续发生的微小变化，计算整个过程产生的累积结果。',
        '微积分正是在研究这类问题的过程中逐渐形成的。其中，导数用来描述一个量在某一点附近怎样变化，积分则用来计算连续过程所产生的累积结果。至于极限，它为导数和积分提供了基础：我们可以先进行一系列越来越精细的近似，再判断这些近似是否会趋向一个确定的数值。',
      ],
      visual: {
        id: 'calculus-change-accumulation-figure',
        kind: 'calculus-change-and-accumulation',
        title: '同一条曲线中的变化与累积',
        description: '左图用曲线在一点的切线表示局部变化率，右图用曲线下方的着色区域表示从起点到当前位置的连续累积。',
        caption: '导数观察曲线在当前位置的变化，积分记录曲线在一段区间内产生的累积。',
      },
    },
    {
      id: 'calculus-history',
      title: '微积分是怎样形成的',
      paragraphs: [
        '微积分中的很多观念，最早可以追溯到古希腊时期。当时的数学家已经开始研究圆、抛物线弓形以及其他曲边图形的面积。但是，传统几何擅长处理三角形、矩形和多边形，对于边界不断弯曲的图形则没有现成的面积公式。',
        '为了解决这个问题，欧多克索斯发展了穷竭法。他会在曲边图形内部构造一组可以计算面积的简单图形，再逐步增加这些图形的数量，使尚未覆盖的部分越来越小。阿基米德后来进一步运用这种方法研究圆、抛物线弓形和各种立体。在他的计算中，一系列不断减小的面积会被连续相加，因此已经可以看到无限逼近和无限累积的思想。',
        '不过，古希腊数学家仍然主要依靠几何证明，每一种图形通常都需要单独处理。到了17世纪，数学家开始面对更多与连续变化有关的问题。天文学需要描述行星的运动，力学开始研究速度不断改变的物体，解析几何则带来了曲线的切线、极值和曲边面积等问题。费马、卡瓦列里和巴罗等人分别提出了有效的方法，也为后来微积分体系的建立准备了条件。',
        '牛顿在1660年代研究“流数法”时，将几何量理解为随时间流动的量。位置可以随着时间连续改变，速度则表示这种改变在当前时刻有多快。由于牛顿长期研究运动和力学，他的微积分思想也带有明显的运动背景。',
        '莱布尼茨则采用了另一套思路。他研究相邻数值之间的微小差异，并设计了 dx、dy 和 ∫ 等符号，使求导和积分能够按照相对稳定的规则进行运算。两人的思路不同，建立的计算体系也各有特点。牛顿较早完成相关手稿，莱布尼茨则较早公开发表。现代微积分中沿用了大量莱布尼茨的记号。',
        '不过，这些早期方法虽然能够解决许多复杂问题，对于“无限小的量究竟是什么”却一直缺少足够精确的说明。到了19世纪，柯西开始系统讨论极限、连续和收敛。后来，魏尔斯特拉斯等数学家又进一步整理这些概念，微积分也由此获得了更加严密的理论基础。',
      ],
    },
    {
      id: 'calculus-derivative',
      title: '导数怎样描述一个时刻的变化',
      paragraphs: [
        '假设函数 s(t) 表示汽车在时刻 t 的位置。那么，从时刻 t 到 t+h，汽车的位置变化为 s(t+h)−s(t)。用位置变化除以经过的时间 h，就能得到这段时间内的平均速度。',
        '这里的 h 表示经过的时间。只要 h 仍然大于零，我们计算的就是一段时间内的平均速度，而不是某一个时刻的速度。接下来，可以逐渐缩短这段时间。比如先观察一分钟内的平均速度，再观察一秒、十分之一秒，甚至更短时间内的平均速度。',
        '随着 h 越来越接近零，这些平均速度可能会逐渐接近一个稳定的数值。如果这个数值确实存在，它就表示汽车在时刻 t 的瞬时速度，也就是位置函数在该点的导数。',
        '从函数图像上看，平均变化率对应一条割线的斜率。割线经过曲线上的两个点，当第二个点不断靠近第一个点时，割线也会逐渐接近曲线在这一点的切线。因此，切线斜率可以用来表示函数在某一点的变化率。',
        '导数描述的对象并不限于速度。比如，温度对时间的导数可以说明当前升温或降温的速度；人口对年份的导数可以表示人口当前的增长率；成本对产量的导数，则可以估计多生产一个单位时成本会增加多少。当一个函数在不同位置的导数都被计算出来以后，我们还可以进一步判断这个函数在哪些区间上升，哪些区间下降，哪里可能出现最高点或最低点，以及曲线的弯曲方向怎样改变。',
      ],
      formulas: [
        {
          id: 'calculus-average-rate-formula',
          expression: '[s(t+h) − s(t)] / h',
          explanation: '时刻 t 到 t+h 之间的平均速度。',
        },
        {
          id: 'calculus-derivative-formula',
          expression: 's′(t) = limₕ→₀ [s(t+h) − s(t)] / h',
          explanation: '当时间间隔趋近于零时，平均速度趋向瞬时速度。',
        },
      ],
    },
    {
      id: 'calculus-integral',
      title: '积分怎样计算连续的累积',
      paragraphs: [
        '现在换一个方向来考虑。假设我们已经知道汽车在每个时刻的速度 v(t)，并且希望计算它在一段时间内产生的位移。',
        '如果汽车始终保持同样的速度，那么位移可以直接用“速度乘以时间”计算。但是，当速度持续变化时，整个过程就无法只用一个速度值来代表。这时，可以先将整段时间分成许多较短的区间。',
        '在一个足够短的时间区间内，速度的变化通常比较小，因此可以暂时选取一个速度值，用它乘以这段时间的长度，得到该区间位移的近似值。随后，再将所有小区间的位移相加，就能得到总位移的近似结果。',
        '当然，这种计算一开始会存在误差。但是，当时间区间分得越来越细时，每个区间内的速度变化也会越来越小，近似结果通常会逐渐稳定下来。如果这些和最终趋向一个确定的数值，这个数值就是速度函数在该时间段上的定积分。',
        '在速度—时间图像中，每个小区间产生的位移可以画成一个窄矩形。所有矩形的面积相加，就近似表示汽车的总位移。需要注意的是，如果速度为负，对应的位移也会被记为负数。因此，定积分计算的是带有方向的净累积。',
        '同样的计算思路也可以应用到其他连续过程。流量随时间的积分可以得到液体总量，功率随时间的积分可以得到消耗的能量，物体各处的密度经过积分则可以得到总质量。曲线下面积只是积分在图像上的一种表现，它所描述的核心仍然是连续累积。',
      ],
      formulas: [
        {
          id: 'calculus-definite-integral-formula',
          expression: '∫ₐᵇ v(t) dt',
          explanation: '速度函数从时刻 a 到时刻 b 产生的净位移。',
        },
      ],
    },
    {
      id: 'calculus-fundamental-theorem',
      title: '导数和积分为什么会联系在一起',
      paragraphs: [
        '设 f(t) 表示一个不断变化的量，并定义 A(x)=∫ₐˣf(t)dt。这里的 A(x) 表示从固定起点 a 到当前位置 x 为止，函数 f(t) 已经累积了多少。',
        '现在让积分的终点从 x 移动到 x+h。在这个过程中，A(x) 增加的部分来自区间 [x,x+h]。如果 h 很小，那么函数在这段区间内的数值会比较接近 f(x)，新增的累积量也就近似为 f(x)·h。',
        '将新增的累积量除以区间宽度 h，得到的结果会接近 f(x)。当 h 趋近于零时，可以得到 A′(x)=f(x)。也就是说，当积分的终点向前移动时，累积量增加的速度，正好由终点处的函数值决定。例如，水流当前的流量越大，容器中水量增加得就越快；汽车当前的速度越高，已经行驶的路程增长得也越快。',
        '如果某个函数 F(x) 的导数等于 f(x)，那么从 a 到 b 的累积结果可以写成 F(b)−F(a)。这个关系被称为微积分基本定理。由于导数和积分之间存在这样的联系，许多原本需要通过大量小区间求和的问题，可以转化为寻找原函数，并计算它在两个端点上的差值。',
      ],
      formulas: [
        {
          id: 'calculus-accumulation-derivative-formula',
          expression: 'A(x) = ∫ₐˣ f(t) dt  ⇒  A′(x) = f(x)',
          explanation: '累积函数在当前位置的变化率，等于此处正在参与累积的函数值。',
        },
        {
          id: 'calculus-fundamental-theorem-formula',
          expression: '若 F′(x)=f(x)，则 ∫ₐᵇ f(x) dx = F(b) − F(a)',
          explanation: '通过原函数在两个端点上的差值，可以计算整个区间的定积分。',
        },
      ],
    },
    {
      id: 'calculus-interaction-guide',
      title: '在图像中观察这种联系',
      paragraphs: [
        '下面的互动模块采用函数 f(x)=x²。先移动曲线上的基准点，再逐渐缩小两点之间的距离。图中的割线会随之接近切线，读数区则会同步显示两条直线的斜率。',
        '当两点间距越来越小时，割线斜率与切线斜率之间的差也会越来越小。这个过程对应导数定义中的极限，也能帮助我们理解“某一点的变化率”究竟是怎样从一段区间的平均变化中得到的。',
      ],
    },
  ],
  sources: [
    {
      id: 'source:mactutor-rise-of-calculus',
      kind: 'institution',
      title: 'A history of the calculus',
      creators: ['University of St Andrews, MacTutor History of Mathematics'],
      url: 'https://mathshistory.st-andrews.ac.uk/HistTopics/The_rise_of_calculus/',
      accessedAt: '2026-07-29',
    },
    {
      id: 'source:mactutor-cauchy-calculus',
      kind: 'institution',
      title: 'Cauchy\'s Calculus',
      creators: ['University of St Andrews, MacTutor History of Mathematics'],
      url: 'https://mathshistory.st-andrews.ac.uk/Extras/Cauchy_Calculus/',
      accessedAt: '2026-07-29',
    },
    {
      id: 'source:openstax-derivative',
      kind: 'textbook',
      title: 'Calculus Volume 1: Defining the Derivative',
      creators: ['Gilbert Strang', 'Edwin Herman'],
      publisher: 'OpenStax, Rice University',
      publishedYear: 2016,
      locator: 'Section 3.1',
      url: 'https://openstax.org/books/calculus-volume-1/pages/3-1-defining-the-derivative',
      accessedAt: '2026-07-29',
      license: 'CC BY-NC-SA 4.0',
    },
    {
      id: 'source:openstax-definite-integral',
      kind: 'textbook',
      title: 'Calculus Volume 1: The Definite Integral',
      creators: ['Gilbert Strang', 'Edwin Herman'],
      publisher: 'OpenStax, Rice University',
      publishedYear: 2016,
      locator: 'Section 5.2',
      url: 'https://openstax.org/books/calculus-volume-1/pages/5-2-the-definite-integral',
      accessedAt: '2026-07-29',
      license: 'CC BY-NC-SA 4.0',
    },
    {
      id: 'source:openstax-fundamental-theorem',
      kind: 'textbook',
      title: 'Calculus Volume 1: The Fundamental Theorem of Calculus',
      creators: ['Gilbert Strang', 'Edwin Herman'],
      publisher: 'OpenStax, Rice University',
      publishedYear: 2016,
      locator: 'Section 5.3',
      url: 'https://openstax.org/books/calculus-volume-1/pages/5-3-the-fundamental-theorem-of-calculus',
      accessedAt: '2026-07-29',
      license: 'CC BY-NC-SA 4.0',
    },
  ],
  frontierStatus: 'established',
  reviewedAt: '2026-07-29',
  reviewDue: '2027-07-29',
  widgetIds: [DERIVATIVE_TANGENT_WIDGET_ID],
} satisfies KnowledgeCardContent
