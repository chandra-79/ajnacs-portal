/* Subject hooks override broad category icons. Geometry illustrates concepts,
   never invented measurements. Related essays may share visual vocabulary. */
import {securityCostOverride,securityCostScene}from'./security-cost-scenes.mjs';
const subjects=[
  [/^contact-feedback$/,'conversation','conversation'],[/^contact-technical-writing$/,'reading','reading'],
  [/compression/,'compute','compression'],
  [/multipass/,'virtualization','guest-vms'],
  [/technical-writing|writing-technical|documentation-for-the-writer/,'reading','reading'],
  [/tech-debt|organizational-debt/,'governance','debt'],[/first-engineering-hire/,'people','hiring'],
  [/mentorship-leverage/,'mentorship','mentorship'],[/async-first-collaboration/,'people','async-collaboration'],
  [/iac-drift/,'governance','configuration-drift'],[/vendor-lock/,'architecture','vendor-boundary'],
  [/retros-without-change/,'people','action-loop'],[/technical-roadmap/,'people','roadmap'],
  [/quiet-engineer|being-a-generalist|being-generalist|staying-technical|manager-transition|leadership-trap/,'people','working-practice'],
  [/tool-solved-wrong-problem/,'governance','problem-fit'],
  [/cloud-certs-vs-skills|resume-cloud/,'people','credentials-practice'],
  [/landing-zone/,'architecture','landing-zone'],[/edge-computing/,'architecture','edge'],
  [/weblogic-domains-clusters/,'architecture','weblogic-domain'],[/bounded-context/,'architecture','contexts'],
  [/monolith|microservice.*module/,'architecture','modules'],[/microservices-team-size|architecture-for-the-team/,'people','teams'],
  [/cloud-native-vs-cloud-hosted/,'architecture','native-hosted'],
  [/multi-cloud-vs-hybrid/,'architecture','multi-hybrid'],
  [/on-premises|private-cloud-setup|azure-arc-hybrid/,'architecture','hybrid'],
  [/managed-service-trap/,'architecture','vendor-boundary'],[/event-sourcing-cqrs/,'stream','event-log'],
  [/snowflake-architecture/,'database','warehouse'],[/wrong-abstraction/,'architecture','abstraction'],
  [/ai-coding-assistants/,'code','assistant'],[/ai-replacing-junior/,'people','mentorship'],
  [/ai-productivity-measurement/,'experiment','outcomes'],[/ai-feature-nobody-uses/,'people','adoption'],
  [/ai-pilot-that-never-ships|ai-adoption-without|shadow-it-ai/,'governance','ai-review'],
  [/designing-tools-for-ai-agents/,'model','tool-boundary'],
  [/feature-engineering|feature-store/,'model','features'],[/mlops-pipelines|production-ml|ml-fails-at-deployment|ml-deployment-failure|aiml-production-ai/,'model','model-lifecycle'],
  [/sdlc-in-the-ai/,'delivery','assistant-lifecycle'],[/aiml-what-is-machine-learning/,'model','learning'],
  [/generative-ai-enterprise/,'model','generation'],
  [/distributed-tracing|os-strace/,'telemetry','traces'],[/profiling|weblogic-performance|oracle-db-performance/,'telemetry','profiling'],
  [/core-vitals/,'telemetry','web-vitals'],[/(?:^|-)slos?(?:-|$)|error-budget/,'telemetry','reliability-budget'],
  [/os-ebpf/,'telemetry','kernel-probe'],[/observab|monitoring/,'telemetry','signals'],
  [/enterprise-middleware/,'network','integration'],[/cloud-native-infrastructure/,'container','namespaces'],
  [/hands-on-lab/,'code','lab'],[/^service-software-engineering$/,'api','service-api'],
  [/mlops-data-pipeline/,'model','model-lifecycle'],[/predictive-analytics/,'model','prediction'],
  [/ai-security-and-iam/,'security','ai-review'],
  [/feature-flag/,'delivery','traffic-switch'],[/deployment-strategies/,'delivery','blue-green'],
  [/notification-systems|email-deliverability/,'delivery','message-queue'],
  [/postgres-mvcc/,'database','row-versions'],[/containers-networking/,'container','namespaces'],
  [/c4-model/,'architecture','c4'],[/hexagonal/,'architecture','hexagonal'],
  [/dimensional-modeling|star-schema/,'database','star-schema'],[/graph-databases/,'database','graph'],
  [/dynamodb-data-modeling/,'database','partition'],[/postgres-jsonb/,'database','json'],
  [/multi-tenancy/,'architecture','tenancy'],[/multi-cloud-vs-multi-region/,'architecture','cloud-comparison'],
  [/multi-region/,'architecture','regions'],[/probabilistic-data/,'database','bloom'],
  [/context-switching|context-switching-cost/,'people','interruptions'],
  [/search-infrastructure/,'index','inverted-index'],[/recommendation-systems/,'model','ranking'],
  [/sql-window-functions/,'database','window'],[/audit-logging|structured-logging|os-audit-framework/,'telemetry','logs'],
  [/trace-sampling/,'telemetry','traces'],[/dora-metrics/,'telemetry','dora'],
  [/twelve-factor/,'architecture','principles'],[/post-quantum/,'security','crypto-transition'],
  [/os-shell|os-text-processing/,'code','terminal'],[/os-users-permissions/,'identity','permissions'],
  [/os-systemd/,'compute','dependencies'],
  [/ai-governance|responsible-ai|ai-regulated/,'governance','ai-review'],
  [/associate-cloud-engineer|architect-associate-guide/,'architecture','study-map'],
  [/cost-of-technical-debt|technical-debt/,'governance','debt'],
  [/api-documentation/,'api','documentation'],[/api-sdk/,'api','sdk'],
  [/error-handling/,'api','error-branch'],[/file-upload/,'api','chunks'],[/graphql/,'api','query-graph'],
  [/api-version/,'api','versions'],[/grpc-vs-rest/,'api','protocols'],
  [/python-async|asyncio|virtual-thread|processes-and-concurrency|java-concurrency/,'code','lanes'],
  [/contract-testing|testing|test-/,'code','tests'],[/typescript|type-system|prog-lang-types/,'code','type-contract'],
  [/monorepo/,'code','workspace'],[/debug/,'code','debug'],
  [/memory-management|os-memory|garbage-collect/,'compute','memory'],
  [/cpu|performance-cpu|virtual-thread|concurrency/,'compute','lanes'],
  [/disk-io|storage-management|filesystem/,'compute','storage'],[/os-boot/,'compute','boot'],
  [/neural-network/,'model','neural'],[/multi-agent|agentic/,'model','agents'],
  [/model-eval|ai-eval|evaluation/,'model','evaluation'],
  [/llm|language-model|prompt-engineering|context-engineering/,'model','tokens'],
  [/hiring|interview/,'people','hiring'],[/meeting/,'people','meeting'],
  [/team-topolog|conways/,'people','teams'],[/estimat|sprint-velocity/,'people','estimation'],
];
export function subjectOverride(slug){const precise=securityCostOverride(slug);if(precise)return precise;const row=subjects.find(([rx,,detail])=>rx.test(slug)&&!(detail==='tokens'&&/rag|security|injection|retrieval/.test(slug))&&!(detail==='tests'&&/ab-testing|experimentation/.test(slug)));return row?{layout:row[1],detail:row[2]}:null;}

export function articleSpecificScene(direction,c1,c2){
  const precise=securityCostScene(direction,c1,c2);if(precise)return precise;
  const detail=direction.detail;if(!detail)return null;
  const rect=(x,y,w,h,fill='none',r=6)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
  const line=(x,y,X,Y)=>`<path d="M${x} ${y}L${X} ${Y}"/>`;
  const text=(x,y,s,size=14)=>`<text x="${x}" y="${y}" fill="${c1}" stroke="none" font-family="Arial,sans-serif" font-size="${size}" text-anchor="middle">${s}</text>`;
  const dot=(x,y,r=7)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c2}"/>`;
  const box=(x,y,w,h,label)=>rect(x,y,w,h)+text(x+w/2,y+h/2+5,label);
  const rows=(x,y,n,w=140)=>Array.from({length:n},(_,i)=>line(x,y+i*20,x+w,y+i*20)).join('');
  const edge=(x,y,X,Y)=>line(x,y,X,Y)+`<path d="M${X-7} ${Y-4}L${X} ${Y}l-7 4"/>`;
  let art='';
  if(detail==='service-api')art=[['Request',10],['Validate',150],['Service',290],['JSON response',430]].map(([t,x],i)=>box(x,65,110,85,t)+(i<3?edge(x+117,108,x+135,108):'')).join('')+text(280,180,'A validated request and a bounded response',12);
  if(detail==='guest-vms')art=rect(20,10,520,198)+text(280,36,'Full guest systems on a local host')+[40,215,390].map((x,i)=>rect(x,60,130,105)+text(x+65,85,'VM '+String.fromCharCode(65+i))+line(x,97,x+130,97)+text(x+65,127,'Guest OS')+text(x+65,151,'Apps + services',11)).join('')+line(35,178,525,178)+text(280,199,'Hypervisor / host',13);
  if(detail==='native-hosted')art=rect(20,20,235,180)+text(138,48,'Cloud hosted')+box(50,78,175,90,'Existing application')+rect(305,20,235,180)+text(423,48,'Cloud native')+[[325,80],[435,80],[380,145]].map(([x,y],i)=>box(x,y,85,40,['Service','Managed','Scale'][i])).join('')+line(410,100,435,100)+line(368,120,410,145)+line(478,120,435,145);
  if(detail==='multi-hybrid')art=rect(20,20,235,180)+text(138,48,'Multi-cloud')+box(40,85,90,70,'Cloud A')+box(145,85,90,70,'Cloud B')+rect(305,20,235,180)+text(423,48,'Hybrid')+box(325,85,90,70,'Local')+box(430,85,90,70,'Cloud')+line(130,120,145,120)+line(415,120,430,120);
  if(detail==='async-collaboration')art=box(25,35,155,130,'Written context')+edge(190,100,270,100)+box(280,35,250,130,'Independent reply')+`<circle cx="75" cy="195" r="18"/><path d="M95 195h95m280-15a18 18 0 1 0 20 27"/>`+text(280,215,'A hand-off across working hours',12);
  if(detail==='configuration-drift')art=rect(25,25,220,165)+text(135,55,'Declared state')+rect(315,25,220,165)+text(425,55,'Running state')+rows(50,80,5,160)+rows(340,80,3,160)+`<path d="M340 146h120" stroke="${c2}" stroke-width="6"/>`+text(280,215,'Detect · explain · reconcile',12);
  if(detail==='vendor-boundary')art=rect(20,20,200,180)+text(120,50,'Your system')+box(45,80,150,70,'Workload')+`<path d="M280 10v195" stroke-dasharray="7 7"/>`+box(340,45,190,100,'Provider service')+edge(200,110,330,110)+text(280,215,'Contract · exit cost · deliberate choice',12);
  if(detail==='action-loop')art=[['Reflect',30,30],['Choose action',350,30],['Change practice',190,145]].map(([t,x,y])=>box(x,y,170,55,t)).join('')+edge(205,58,340,58)+edge(430,90,365,150)+edge(185,165,100,95);
  if(detail==='roadmap')art=[['Now',25],['Next',210],['Later',395]].map(([t,x],i)=>rect(x,40,145,140)+text(x+72,65,t)+[0,1,2].map(j=>rect(x+18,90+j*28,110,17,i===1&&j===0?c2:'none')).join('')).join('')+text(280,215,'Sequencing under changing constraints',12);
  if(detail==='working-practice')art=rect(120,20,320,150)+text(280,52,'Engineering practice')+rows(145,82,3,160)+`<path d="M90 190h380M185 175v-15m190 15v-15"/>`+dot(490,70,18)+text(280,220,'Craft · judgement · shared work',12);
  if(detail==='problem-fit')art=box(20,40,160,130,'Problem')+box(380,40,160,130,'Tool')+`<path d="M220 75l120 70m-120 0l120-70" stroke="${c2}"/>`+text(280,215,'Validate the fit before the solution',12);
  if(detail==='credentials-practice')art=rect(25,30,210,160)+text(130,60,'Certification')+rect(325,30,210,160)+text(430,60,'Production practice')+rows(48,85,4,160)+rect(350,85,160,85)+text(430,135,'$ diagnose · operate',13)+text(280,215,'Complementary, not interchangeable',12);
  if(detail==='landing-zone')art=rect(20,10,520,198)+text(280,35,'Governed cloud boundary')+[['Identity',40],['Network',215],['Workloads',390]].map(([t,x])=>box(x,65,130,115,t)).join('');
  if(detail==='edge')art=box(195,45,170,110,'Central platform')+[[45,45],[45,170],[490,45],[490,170]].map(([x,y],i)=>line(x, y, x<200?195:365,100)+dot(x,y,20)+text(x,y<100?14:213,'Edge',12)).join('');
  if(detail==='weblogic-domain')art=rect(25,10,510,195)+text(280,35,'WebLogic domain')+box(205,50,150,45,'AdminServer')+[[65,125],[225,125],[385,125]].map(([x,y],i)=>line(280,95,x+55,y)+box(x,y,110,55,'Managed '+(i+1))).join('');
  if(detail==='contexts')art=box(25,25,200,160,'Bounded context A')+box(335,25,200,160,'Bounded context B')+edge(230,105,325,105)+text(280,215,'Explicit language and integration contracts',12);
  if(detail==='modules')art=rect(35,10,490,195)+text(280,40,'One deployable boundary')+[['Module A',65,65],['Module B',290,65],['Module C',65,125],['Module D',290,125]].map(([t,x,y])=>box(x,y,200,45,t)).join('');
  if(detail==='hybrid')art=box(20,35,185,145,'Local systems')+box(355,35,185,145,'Cloud control plane')+edge(210,90,345,90)+edge(345,135,210,135)+text(280,215,'Identity · policy · network boundary',12);
  if(detail==='event-log')art=box(20,75,120,75,'Command')+edge(145,110,210,110)+[0,1,2,3].map(i=>rect(220+i*22,45+i*25,110,42)).join('')+edge(405,110,455,110)+box(460,75,90,75,'Read view')+text(280,215,'Append events · project state',12);
  if(detail==='warehouse')art=rect(25,25,200,160)+text(125,65,'Shared storage')+[0,1,2].map(i=>line(230,105,350,45+i*65)+box(355,20+i*65,180,45,'Compute pool')).join('');
  if(detail==='abstraction')art=box(25,25,510,53,'Interface')+[['Case A',45],['Case B',225],['Exception',405]].map(([t,x],i)=>line(280,80,x+50,125)+box(x,130,110,55,t)).join('')+text(280,215,'A boundary must earn its complexity',12);
  if(detail==='assistant')art=rect(25,20,320,175)+text(185,50,'Developer workspace')+rows(45,85,4,200)+rect(180,123,145,36,c2)+box(395,60,140,105,'AI assistant')+line(350,100,390,100);
  if(detail==='mentorship')art=box(195,70,170,105,'Shared learning')+dot(90,60,20)+`<path d="M50 160v-20a40 40 0 0180 0v20"/>`+dot(470,75,16)+`<path d="M438 160v-14a32 32 0 0164 0v14"/>`+line(140,110,190,110)+line(370,110,430,110);
  if(detail==='outcomes')art=[['Activity',30],['Quality',210],['Useful outcome',390]].map(([t,x])=>box(x,40,145,135,t)+rect(x+25,100,95,45)).join('')+text(280,215,'Different questions require different evidence',12);
  if(detail==='adoption')art=box(25,25,245,170,'Shipped capability')+box(350,60,180,100,'User need')+`<path d="M280 110h60" stroke-dasharray="6 6"/>`+text(280,215,'Usage and usefulness need to meet',12);
  if(detail==='tool-boundary')art=box(20,55,140,100,'Agent')+edge(165,105,220,105)+box(225,20,150,180,'Tool contract')+box(425,55,115,100,'Resource')+edge(380,105,420,105)+text(280,215,'Schema · permission · bounded execution',12);
  if(detail==='features')art=rect(30,15,495,190)+text(280,40,'Versioned features')+[['Entity','Feature','Event time'],['Account','Recent usage','As of request'],['Item','Attributes','As of event']].map((r,i)=>r.map((t,j)=>text(110+j*165,80+i*46,t,12)).join('')+line(45,94+i*46,510,94+i*46)).join('');
  if(detail==='assistant-lifecycle')art=[['Specify',20],['Implement',160],['Review',300],['Operate',440]].map(([t,x],i)=>box(x,85,110,80,t)+(i<3?edge(x+113,125,x+136,125):'')).join('')+box(175,10,210,45,'AI assistance, human decisions')+line(280,60,280,80);
  if(detail==='learning')art=box(25,45,150,120,'Examples')+edge(180,105,230,105)+box(235,45,135,120,'Learn')+edge(375,105,420,105)+box(425,45,115,120,'New input')+text(280,210,'Learn a pattern; evaluate on unseen cases',12);
  if(detail==='generation')art=box(20,55,140,100,'Context')+edge(165,105,225,105)+box(230,25,140,160,'Generation')+edge(375,105,425,105)+box(430,55,110,100,'Review')+text(280,215,'Ground · generate · verify',12);
  if(detail==='profiling')art=[0,1,2,3].map(i=>Array.from({length:4-i},(_,j)=>rect(35+i*45+j*125,165-i*43,115,35,(i+j)%3===0?c2:'none')).join('')).join('')+text(280,215,'Stack samples — schematic, not measured widths',12);
  if(detail==='web-vitals')art=[['LCP',30],['INP',210],['CLS',390]].map(([t,x],i)=>box(x,35,145,160,t)+text(x+72,160,['Loading','Responsiveness','Visual stability'][i],12)).join('');
  if(detail==='reliability-budget')art=rect(20,25,230,160)+text(135,55,'User-facing objective')+rect(310,25,230,160)+text(425,55,'Error budget')+rows(45,85,4,175)+rows(335,85,4,175)+text(280,215,'A reliability contract, not invented measurements',12);
  if(detail==='kernel-probe')art=box(25,15,510,65,'User-space analysis')+box(25,130,510,65,'Kernel events')+edge(280,125,280,86)+text(280,215,'Attach probe · collect events · investigate',12);
  if(detail==='signals')art=[['Logs',25],['Metrics',210],['Traces',395]].map(([t,x],i)=>box(x,25,140,135,t)+[rows(x+15,80,3,110),'<path d="M235 120h25V85h25v35h25V65h25v55"/>','<path d="M425 75h75m-45 0v35h45m-25 0v30h25"/>'][i]).join('')+text(280,210,'Different signals, shared operational context',12);
  if(detail==='source-code'){
    const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    art=rect(30,10,500,200)+direction.codeExcerpt.map((s,i)=>`<text x="48" y="${37+i*29}" fill="${i%2?c1:c2}" stroke="none" font-family="monospace" font-size="14">${esc(s)}</text>`).join('');
  }
  if(detail==='tests')art=[['Arrange',30],['Act',210],['Assert',390]].map(([t,x],i)=>box(x,35,145,60,t)+rect(x,125,145,65)+`<path d="M${x+30} 155l15 15 32-32"/>`+(i<2?edge(x+150,65,x+175,65):'')).join('');
  if(detail==='type-contract')art=box(20,60,145,90,'Input')+box(215,20,150,175,'Typed contract')+box(415,60,125,90,'Result')+line(165,105,215,105)+line(365,105,415,105)+text(290,65,'name: string',13)+text(290,150,'value: number',13);
  if(detail==='workspace'||detail==='debug')art=box(205,10,150,48,detail==='workspace'?'Workspace':'Call stack')+[[30,120],[215,120],[400,120]].map(([x,y],i)=>line(280,60,x+65,y)+box(x,y,130,65,detail==='workspace'?'Package '+String.fromCharCode(65+i):'Frame '+(i+1))).join('');
  if(detail==='compression')art=rect(20,40,160,140)+text(100,64,'Input file')+rows(40,90,4,115)+edge(190,110,290,110)+rect(300,35,225,150)+text(412,61,'Encoded frame')+box(315,77,195,30,'Header / dictionary')+[0,1,2].map(i=>rect(315+i*67,118,59,50,i===1?c2:'none')).join('')+`<path d="M405 195Q260 245 95 195"/>`+text(260,182,'Decode',14);
  if(detail==='integration')art=box(208,60,145,95,'Middleware')+[[35,20],[35,140],[405,20],[405,140]].map(([x,y],i)=>box(x,y,120,55,['Service','Events','Database','API'][i])+line(x<200?155:405,y+28,x<200?208:353,108)).join('');
  if(detail==='namespaces')art=[30,325].map((x,i)=>rect(x,20,205,180)+text(x+102,48,'Namespace '+String.fromCharCode(65+i))+box(x+35,85,135,65,'Workload')).join('')+line(235,115,325,115);
  if(detail==='lab')art=rect(40,20,475,170)+line(40,50,515,50)+rect(65,72,190,90)+box(285,72,200,90,'Sandbox')+text(155,125,'$ try · observe · learn',14)+text(280,220,'Hands-on environment');
  if(detail==='model-lifecycle')art=[['Data',30],['Train',170],['Evaluate',310],['Deploy',450]].map(([t,x],i)=>box(x,65,105,80,t)+(i<3?edge(x+107,105,x+136,105):'')).join('')+`<path d="M500 160Q280 250 70 160" stroke-dasharray="7 7"/>`;
  if(detail==='prediction')art=box(30,48,145,125,'Historical inputs')+box(220,75,120,75,'Model')+box(385,48,145,125,'Prediction')+line(175,112,220,112)+line(340,112,385,112)+text(280,214,'A workflow, not measured results');
  if(detail==='traffic-switch'||detail==='blue-green')art=box(20,75,120,70,'Traffic')+line(140,110,230,110)+line(230,110,340,55)+line(230,110,340,165)+box(345,20,180,70,detail==='blue-green'?'Blue release':'Enabled')+box(345,130,180,70,detail==='blue-green'?'Green release':'Control')+dot(230,110,18);
  if(detail==='message-queue')art=[0,1,2].map(i=>rect(30+i*14,50+i*18,125,80)+`<path d="M${30+i*14} ${50+i*18}l62 42 63-42"/>`).join('')+edge(190,115,260,115)+box(265,60,130,110,'Queue')+edge(400,115,460,115)+rect(465,75,65,80)+text(280,215,'Enqueue · attempt · deliver');
  if(detail==='row-versions')art=[['Snapshot A',30],['Snapshot B',215],['Vacuum',400]].map(([t,x],i)=>text(x+65,30,t)+[0,1,2,3].map(j=>rect(x,50+j*36,130,28,(j===i)?c2:'none')).join('')).join('');
  if(detail==='c4')art=rect(25,8,510,195)+rect(115,45,335,132)+rect(225,85,150,66)+text(75,32,'System')+text(170,70,'Container')+text(300,125,'Component');
  if(detail==='hexagonal')art=`<path d="M280 27l85 48v96l-85 48-85-48V75z"/>${text(280,124,'Domain')}${[0,1,2,3,4,5].map(i=>{const a=i*Math.PI/3,x=280+Math.cos(a)*185,y=120+Math.sin(a)*100;return line(280+Math.cos(a)*95,120+Math.sin(a)*65,x,y)+rect(x-18,y-12,36,24,c2);}).join('')}`;
  if(detail==='graph'||detail==='query-graph')art=`${[[65,85,215,35],[215,35,385,75],[385,75,490,160],[215,35,275,175],[275,175,490,160],[65,85,275,175],[275,175,385,75]].map(e=>line(...e)).join('')}${[[65,85],[215,35],[385,75],[490,160],[275,175]].map(([x,y],i)=>dot(x,y,i===1?22:15)).join('')}`;
  if(detail==='star-schema')art=[[170,65,215,82],[390,65,345,82],[170,150,215,132],[390,150,345,132]].map(e=>line(...e)).join('')+[[40,15],[390,15],[40,150],[390,150]].map(([x,y])=>box(x,y,130,50,'Dimension')).join('')+box(215,75,130,65,'Fact');
  if(detail==='partition'||detail==='tenancy')art=[40,215,390].map((x,i)=>rect(x,20,135,178)+text(x+67,48,detail==='tenancy'?'Tenant '+String.fromCharCode(65+i):'Partition '+String.fromCharCode(65+i))+rows(x+18,78,5,98)).join('');
  if(detail==='json')art=box(30,40,180,140,'Relational')+box(330,40,190,140,'JSON document')+line(210,110,330,110)+text(425,80,'{ key: value }',18)+text(425,150,'{ nested: {…} }',16);
  if(detail==='regions'||detail==='cloud-comparison')art=[35,325].map((x,i)=>`<ellipse cx="${x+100}" cy="110" rx="110" ry="83" stroke-dasharray="5 7"/>${box(x+20,70,160,76,detail==='regions'?'Region '+String.fromCharCode(65+i):i?'Regional replicas':'Provider boundary')}`).join('')+`<path d="M160 24Q280-20 400 24M160 195Q280 240 400 195"/>`;
  if(detail==='bloom')art=text(280,24,'Probabilistic membership')+Array.from({length:16},(_,i)=>rect(30+i*31,90,27,42,[1,4,6,11,14].includes(i)?c2:'none',0)).join('')+edge(140,40,177,82)+edge(280,40,239,82)+edge(420,40,425,82)+text(280,180,'Hash → bit positions → possible membership');
  if(detail==='interruptions')art=[0,1,2].map(i=>line(30,55+i*65,530,55+i*65)).join('')+[[30,33,150],[210,33,80],[330,33,170],[30,98,80],[150,98,210],[405,98,90],[30,163,240],[330,163,140]].map(([x,y,w],i)=>rect(x,y,w,38,i%2?c2:'none')).join('')+text(280,20,'Interrupted attention');
  if(detail==='inverted-index')art=[['cloud',38],['cache',102],['index',166]].map(([t,y],i)=>box(20,y,120,38,t)+edge(145,y+18,220,y+18)+[0,1,2].map(j=>box(230+j*100,y,85,38,'doc '+(i+j+1))).join('')).join('');
  if(detail==='window')art=rect(75,10,410,200)+[0,1,2,3,4,5].map(i=>line(75,42+i*28,485,42+i*28)).join('')+line(210,10,210,210)+line(350,10,350,210)+rect(216,74,264,81,c2)+text(280,30,'Partitioned rows')+text(350,198,'Window frame');
  if(detail==='logs')art=[0,1,2,3,4].map(i=>rect(45,20+i*35,385,27)+rows(65,34+i*35,1,270)).join('')+edge(465,35,465,182)+text(280,215,'Append-only records');
  if(detail==='traces'||detail==='dependencies')art=box(190,8,175,40,detail==='traces'?'Request':'Service')+[[40,90],[225,90],[410,90]].map(([x,y],i)=>line(280,50,x+55,y)+box(x,y,110,40,detail==='traces'?'Span':'Unit')+line(x+55,y+40,x+55,185)+dot(x+55,190,i===1?15:7)).join('');
  if(detail==='dora')art=[['Deployment frequency',30,15],['Change lead time',300,15],['Change failure rate',30,125],['Recovery time',300,125]].map(([t,x,y],i)=>box(x,y,230,75,t)+line(x+25,y+52,x+205,y+52)+dot(x+40+i*25,y+52,5)).join('');
  if(detail==='ranking')art=[0,1,2,3,4].map(i=>dot(45,28+i*37,10)+line(60,28+i*37,210,110)).join('')+box(215,65,130,90,'Rank')+[0,1,2].map(i=>line(345,110,430,45+i*65)+box(435,25+i*65,100,40,'Candidate')).join('');
  if(detail==='principles'||detail==='study-map')art=[0,1,2,3,4,5].map(i=>{const x=30+(i%3)*175,y=20+Math.floor(i/3)*105;return box(x,y,145,78,(detail==='principles'?['Config','Dependencies','Processes','Logs','Release','Resources']:['Network','Identity','Compute','Storage','Operations','Review'])[i]);}).join('');
  if(detail==='crypto-transition')art=box(20,58,160,105,'Current keys')+edge(185,110,365,110)+box(370,58,160,105,'New algorithms')+text(280,45,'Crypto-agility')+text(280,195,'Inventory · compatibility · transition');
  if(detail==='terminal'||detail==='documentation'||detail==='sdk'||detail==='versions'||detail==='protocols'){
    const label=({terminal:'$ command | filter | output',documentation:'API reference',sdk:'SDK package',versions:'v1 → v2',protocols:'REST ↔ gRPC'})[detail];
    art=rect(75,15,410,185)+line(75,47,485,47)+dot(95,31,4)+dot(112,31,4)+dot(129,31,4)+text(280,85,label,19)+rows(105,115,4,260);
    if(detail==='sdk')art+=rect(385,125,100,78,c2)+text(435,174,'SDK');
  }
  if(detail==='permissions')art=text(280,20,'Identity × permission')+Array.from({length:4},(_,i)=>Array.from({length:6},(_,j)=>rect(65+j*73,45+i*39,59,29,(i+j)%3===0?c2:'none')).join('')).join('');
  if(detail==='ai-review')art=box(30,57,150,100,'Model')+box(360,57,170,100,'Approval boundary')+`<path d="M205 10h120v195H205z"/>`+text(265,50,'Evidence')+rows(225,78,5,80)+line(180,107,205,107)+line(325,107,360,107);
  if(detail==='debt')art=[0,1,2,3,4].map(i=>rect(40+i*36,150-i*28,150,46)+rows(55+i*36,169-i*28,1,100)).join('')+text(420,90,'Deferred changes')+text(420,125,'Compounding work');
  if(detail==='error-branch')art=box(20,75,140,65,'Request')+line(160,108,260,108)+`<path d="M260 108l65-65 65 65-65 65z"/>`+line(390,108,500,45)+line(390,108,500,180)+text(480,30,'Success')+text(470,210,'Error / retry');
  if(detail==='chunks')art=[0,1,2,3].map(i=>box(30+i*125,30+i*20,105,52,'Chunk '+(i+1))).join('')+edge(80,175,480,175)+text(280,215,'Upload · resume · assemble');
  if(detail==='memory')art=[0,1,2,3,4,5,6,7].map(i=>rect(40+i*62,60,56,100,i<3||i===5?c2:'none')).join('')+text(280,30,'Address space')+text(280,205,'Allocation · reclamation · isolation');
  if(detail==='lanes')art=[0,1,2,3].map(i=>line(20,40+i*45,535,40+i*45)+[0,1,2].map(j=>rect(40+j*155+(i%2)*40,24+i*45,90,30,j===i%3?c2:'none')).join('')).join('');
  if(detail==='storage')art=[0,1,2].map(i=>`<ellipse cx="${120+i*160}" cy="55" rx="58" ry="20"/><path d="M${62+i*160} 55v98c0 28 116 28 116 0V55"/>`).join('')+text(280,210,'Blocks · queues · persistence');
  if(detail==='boot')art=[['Firmware',30],['Kernel',170],['Services',310],['Ready',450]].map(([t,x],i)=>box(x,75,105,70,t)+(i<3?edge(x+108,110,x+135,110):'')).join('');
  if(detail==='neural')art=[0,1,2].map(i=>[0,1,2,3].map(j=>dot(90+i*185,35+j*50,12)+(i<2?[0,1,2,3].map(k=>line(103+i*185,35+j*50,263+i*185,35+k*50)).join(''):'')).join('')).join('');
  if(detail==='agents')art=[0,1,2,3].map(i=>{const a=i*Math.PI/2,x=280+Math.cos(a)*185,y=110+Math.sin(a)*75;return box(x-50,y-25,100,50,['Plan','Act','Observe','Review'][i]);}).join('')+`<ellipse cx="280" cy="110" rx="150" ry="65" stroke-dasharray="8 5"/>`;
  if(detail==='tokens')art=[0,1,2].map(i=>[0,1,2,3,4,5].map(j=>rect(25+j*86,25+i*61,73,42,(i===1&&j>2)?c2:'none')).join('')).join('')+text(280,218,'Context · tokens · generation');
  if(detail==='evaluation')art=[['Task',35],['Output',205],['Review',375]].map(([t,x])=>box(x,35,145,65,t)+rect(x,125,145,60)+`<path d="M${x+25} 154l15 15 35-35"/>`).join('');
  if(detail==='hiring'||detail==='meeting'||detail==='teams'||detail==='estimation'){
    art=detail==='meeting'?`<ellipse cx="280" cy="110" rx="125" ry="65"/>${[0,1,2,3,4,5].map(i=>{const a=i*Math.PI/3;return dot(280+Math.cos(a)*190,110+Math.sin(a)*92,13);}).join('')}`:detail==='estimation'?`<path d="M40 175C120-10 205 235 285 80s155 90 245-40" stroke-dasharray="9 8"/>${text(280,25,'Uncertainty, not a promise')}${[90,260,460].map((x,i)=>rect(x,80+i*20,60,60)).join('')}`:detail==='hiring'?rect(205,10,150,200)+dot(275,70,22)+`<path d="M235 160v-25a40 40 0 0180 0v25"/>`+edge(40,110,175,110)+edge(380,110,520,110):[[110,65],[280,155],[450,65]].map(([x,y])=>[[-20,-10],[0,15],[20,-10]].map(([dx,dy])=>dot(x+dx,y+dy,12)).join('')).join('')+line(140,85,245,145)+line(310,145,420,85);
  }
  return art?`<g data-subject-detail="${detail}" stroke="${c1}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">${art}</g>`:null;
}
