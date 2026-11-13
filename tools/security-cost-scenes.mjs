/* Subject scenes grounded in the corresponding source articles. Diagrams are
   conceptual: there are no invented prices, percentages, measurements or claims. */
const assignments = new Map();
const assign = (layout, detail, slugs) => slugs.split(/\s+/).filter(Boolean).forEach(slug => assignments.set(slug, {layout, detail: `sc-${detail}`}));
assign('identity', 'authorization-models', 'authorization-models-rbac-abac-rebac');
assign('identity', 'least-privilege', 'cloud-iam-least-privilege');
assign('identity', 'federation', 'enterprise-sso-for-saas');
assign('identity', 'delegation', 'oauth2-oidc-enterprise-guide');
assign('identity', 'lifecycle', 'scim-identity-provisioning');
assign('identity', 'zero-trust', 'zero-trust-network-access zero-trust zero-trust-architecture-not-product');
assign('identity', 'edge-policy', 'cloudflare-warp-zero-trust-networking');
assign('identity', 'edge-transport', 'cloudflare-warp-misconceptions');
assign('identity', 'unix-permissions', 'os-users-permissions');
assign('security', 'fraud-decisions', 'fraud-detection-engineering');
assign('security', 'untrusted-context', 'llm-security-prompt-injection');
assign('security', 'minimization', 'privacy-engineering-data-minimization');
assign('security', 'session-state', 'session-management-web-security');
assign('security', 'certificates', 'tls-certificate-management');
assign('security', 'browser-boundary', 'web-security-csp-xss');
assign('security', 'admin-boundary', 'weblogic-security-hardening');
assign('security', 'pipeline-gates', 'ci-cd-security-gates');
assign('security', 'cluster-policy', 'kubernetes-security-hardening');
assign('security', 'configuration', 'cloud-security-is-configuration');
assign('security', 'provenance', 'supply-chain-security-sbom');
assign('security', 'early-review', 'security-review-end-of-sprint security-shift-left shift-left-security-patterns security-left-is-not-security-free');
assign('security', 'runtime-boundary', 'container-security-runtime containers-security');
assign('security', 'packet-filter', 'os-iptables-firewall');
assign('security', 'key-auth', 'os-ssh');
assign('security', 'server-posture', 'os-security-hardening');
assign('security', 'confinement', 'os-selinux-apparmor');
assign('security', 'vault-rotation', 'secrets-management-cloud');
assign('cost', 'accelerator-scheduling', 'gpu-fleet-utilization');
assign('cost', 'telemetry-pipeline', 'observability-cost-control');
assign('cost', 'metering-ledger', 'usage-metering-billing-systems');
assign('cost', 'egress-boundary', 'cloud-egress-cost-reduction egress-surprise-invoice');
assign('cost', 'unit-economics', 'cloud-unit-economics');
assign('cost', 'allocation', 'finops-chargeback-maturity cloud-cost-attribution-showback-chargeback');
assign('cost', 'maturity', 'finops-maturity-model');
assign('cost', 'commitment', 'reserved-instance-rationalization reserved-instances reserved-instances-are-commitments');
assign('cost', 'practice', 'finops-is-culture');
assign('cost', 'commitment-options', 'aws-savings-plans');
assign('cost', 'billing-analysis', 'gcp-cost-management');
assign('cost', 'abstraction-maintenance', 'platform-abstraction-cost');
assign('cost', 'anomaly-response', 'cloud-cost-anomaly finops-anomaly-detection');
assign('cost', 'continuous-practice', 'cost-optimisation-not-a-project');
assign('cost', 'total-cost', 'private-cloud-economics');
assign('cost', 'named-owner', 'cloud-bill-nobody-owns the-cloud-bill-nobody-owns');
assign('cost', 'showback-first', 'showback-before-chargeback showback-chargeback');
assign('cost', 'provider-allocation', 'multi-cloud-finops-lessons');
assign('cost', 'namespace-costs', 'kubernetes-cost-optimization');
assign('cost', 'resource-tags', 'finops-tagging-policy');
assign('cost', 'token-routing', 'ai-cost-management-production');
assign('cost', 'orphaned-resources', 'ghost-vms-cloud-cost-hidden-waste');

export function securityCostOverride(slug) {
  return assignments.get(String(slug).replace(/^quick-take-/, '')) || null;
}

const xml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function securityCostScene(direction, c1, c2) {
  const detail = direction.detail;
  if (!detail?.startsWith('sc-')) return null;
  const t = (x,y,label,size=13) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="${c1}" stroke="none">${xml(label)}</text>`;
  const line = (x,y,X,Y,attrs='') => `<path d="M${x} ${y}L${X} ${Y}" ${attrs}/>`;
  const arrow = (x,y,X,Y) => {
    const a=Math.atan2(Y-y,X-x), bx=X-Math.cos(a)*7, by=Y-Math.sin(a)*7;
    return line(x,y,X,Y)+`<path d="M${bx-Math.sin(a)*4} ${by+Math.cos(a)*4}L${X} ${Y}L${bx+Math.sin(a)*4} ${by-Math.cos(a)*4}"/>`;
  };
  const rect = (x,y,w,h,accent=false,r=7) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${accent?c2:c1}" fill-opacity="${accent?'.18':'.045'}"/>`;
  const box = (x,y,w,h,label,accent=false) => rect(x,y,w,h,accent)+t(x+w/2,y+h/2+4,label);
  const dot = (x,y,r=7,accent=true) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${accent?c2:c1}" fill-opacity=".8"/>`;
  const cross = (x,y) => `<path d="M${x-5} ${y-5}l10 10m-10 0l10-10" stroke="${c2}"/>`;
  const check = (x,y) => `<path d="M${x-7} ${y}l5 6 11-13" stroke="${c2}"/>`;
  const key = (x,y) => `<circle cx="${x}" cy="${y}" r="13"/>${line(x+13,y,x+48,y)}${line(x+34,y,x+34,y+10)}${line(x+45,y,x+45,y+7)}`;
  const person = (x,y) => `<circle cx="${x}" cy="${y-12}" r="10"/><path d="M${x-18} ${y+23}v-8a18 18 0 0136 0v8"/>`;
  const sheet = (x,y,w=100,h=125) => rect(x,y,w,h)+Array.from({length:Math.min(4,Math.max(1,Math.floor((h-25)/20)))},(_,i)=>line(x+14,y+30+i*20,x+w-14,y+30+i*20)).join('');
  const label = (x,y,lines) => lines.map((s,i)=>t(x,y+i*18,s)).join('');
  let art = '';
  switch(detail.slice(3)) {
    case 'authorization-models':
      art=t(95,22,'RBAC')+t(280,22,'ABAC')+t(465,22,'ReBAC')+
        person(35,85)+arrow(58,95,85,95)+box(90,67,62,55,'Role')+arrow(120,128,120,160)+box(65,165,100,32,'Resource')+
        box(205,49,150,39,'Attributes')+arrow(280,94,280,118)+box(220,124,120,40,'Policy',true)+t(280,198,'Evaluate access')+
        [[420,65,505,93],[505,93,445,159],[420,65,445,159]].map(e=>line(...e)).join('')+dot(420,65)+dot(505,93)+dot(445,159)+t(465,198,'Relationships'); break;
    case 'least-privilege':
      art=person(58,95)+t(58,158,'Workload identity')+arrow(85,99,185,99)+box(190,63,145,73,'Scoped policy',true)+
        arrow(340,99,430,62)+line(340,110,430,155)+box(435,37,112,49,'Required data')+box(435,132,112,49,'Other data')+cross(390,135)+t(280,200,'Only the permissions this workload needs'); break;
    case 'federation':
      art=box(15,27,128,52,'Customer IdP A')+box(15,138,128,52,'Customer IdP B')+arrow(150,53,210,90)+arrow(150,164,210,125)+
        box(215,67,154,81,'Tenant connection',true)+arrow(375,107,425,107)+box(430,75,115,65,'SaaS app')+t(280,207,'Federation per tenant'); break;
    case 'delegation':
      art=box(18,30,128,55,'Client')+box(220,30,140,55,'Authorization')+box(420,30,120,55,'API')+
        arrow(150,44,212,44)+t(180,27,'Consent',11)+arrow(212,76,150,76)+t(180,98,'Code + PKCE',11)+
        key(250,145)+arrow(308,145,420,145)+t(365,132,'Access token',12)+line(480,139,480,90)+t(280,205,'Delegated access; identity through OIDC'); break;
    case 'lifecycle':
      art=[['Join',20,'Create'],['Move',200,'Update'],['Leave',380,'Revoke']].map(([name,x,action],i)=>t(x+80,25,name)+box(x,43,160,65,action,i===2)+person(x+80,148)+(i<2?arrow(x+166,76,x+174,76):'')).join('')+t(280,210,'Application access follows the identity lifecycle'); break;
    case 'zero-trust':
      art=box(15,31,130,51,'Identity')+box(15,134,130,51,'Device posture')+arrow(151,57,210,93)+arrow(151,160,210,125)+
        `<path d="M205 12v195M385 12v195" stroke-dasharray="5 6"/>`+box(220,71,150,70,'Access policy',true)+arrow(392,106,430,106)+box(435,76,112,61,'Resource')+t(280,207,'Verify each access; network location is insufficient'); break;
    case 'edge-policy':
    case 'edge-transport':
      art=person(55,91)+t(55,153,'Device')+arrow(85,102,205,102)+t(142,85,'WireGuard',12)+box(210,62,155,82,'Cloudflare edge',true)+arrow(370,102,425,102)+box(430,70,115,65,'Internet')+
        t(280,174,detail==='sc-edge-policy'?'Identity + device policy':'Encrypted transport to the edge')+
        t(280,207,detail==='sc-edge-policy'?'The edge is not the corporate data centre':'Zero Trust policies require configuration'); break;
    case 'unix-permissions':
      art=t(280,20,'Process identity meets file permissions')+t(92,65,'User / group')+t(270,65,'Owner')+t(365,65,'Group')+t(460,65,'Other')+
        [0,1,2].map(i=>t(92,100+i*42,['Read','Write','Execute'][i])+[0,1,2].map(j=>rect(235+j*95,78+i*42,70,33,i===j)+(i===j?check(270+j*95,94+i*42):'')).join('')).join(''); break;
    case 'fraud-decisions':
      art=box(15,75,120,60,'Transaction')+arrow(140,105,190,105)+box(195,50,170,106,'Rules + model',true)+t(280,140,'Fresh signals',12)+
        arrow(370,79,425,42)+arrow(370,105,425,105)+arrow(370,133,425,174)+box(430,20,115,42,'Allow')+box(430,84,115,42,'Challenge')+box(430,153,115,42,'Reject'); break;
    case 'untrusted-context':
      art=box(15,23,145,52,'Untrusted document')+box(15,145,145,52,'Trusted policy')+arrow(165,49,220,90)+arrow(165,171,220,125)+
        box(225,70,112,75,'Model')+arrow(342,106,385,106)+box(390,64,155,86,'Tool permissions',true)+t(280,209,'Retrieved text does not grant tool authority'); break;
    case 'minimization':
      art=t(130,25,'Collected fields')+t(420,25,'Required for purpose')+sheet(35,40,190,150)+arrow(234,113,325,113)+sheet(340,40,185,105)+
        cross(192,151)+cross(192,171)+t(430,183,'Retention → deletion')+t(280,213,'Collect less; make deletion possible'); break;
    case 'session-state':
      art=t(135,20,'Server-side state')+t(425,20,'Signed claims')+box(20,40,115,50,'Opaque ID')+arrow(140,66,170,66)+box(175,40,90,50,'Store')+
        box(305,40,110,50,'Token')+arrow(420,66,450,66)+box(455,40,90,50,'Verify')+box(62,116,150,80,'Session record')+key(365,145)+t(427,194,'Expiry + rotation')+line(280,25,280,205,'stroke-dasharray="4 7"'); break;
    case 'certificates':
      art=[['Root',20],['Intermediate',200],['Leaf',380]].map(([name,x],i)=>box(x,28,160,62,name)+(i<2?arrow(x+164,60,x+176,60):'')).join('')+
        line(50,153,510,153)+[85,280,475].map((x,i)=>dot(x,153,7)+t(x,191,['Issue','Renew','Retire'][i])).join('')+t(280,124,'Inventory + automated renewal'); break;
    case 'browser-boundary':
      art=rect(160,15,375,184)+line(160,48,535,48)+dot(176,32,4)+dot(190,32,4)+dot(204,32,4)+box(15,75,125,60,'Input')+arrow(145,105,190,105)+
        box(195,70,155,72,'Output encoding',true)+arrow(355,105,385,105)+box(390,70,125,72,'Render text')+t(350,181,'CSP restricts script sources'); break;
    case 'admin-boundary':
      art=box(15,80,115,60,'Public app')+line(135,110,205,110)+cross(170,110)+rect(210,15,335,188)+t(377,40,'Management network')+box(235,68,125,62,'Admin console')+box(389,68,130,62,'T3 access')+key(270,165)+t(437,173,'Patch + audit')+t(95,174,'Restricted entry',11); break;
    case 'pipeline-gates':
      art=[['Source',15],['Build',155],['Image',295],['Deploy',435]].map(([name,x],i)=>box(x,70,105,58,name)+(i<3?arrow(x+110,99,x+135,99):'')).join('')+
        t(207,40,'Dependencies')+t(347,40,'Admission')+check(207,153)+check(347,153)+t(280,201,'Evidence and enforcement at the right stage'); break;
    case 'cluster-policy':
      art=box(15,75,130,60,'Workload')+arrow(150,105,200,105)+box(205,70,140,70,'Admission',true)+arrow(350,105,390,105)+rect(395,25,150,170)+t(470,49,'Namespace')+box(412,76,115,51,'Non-root pod')+t(470,158,'Network policy',12)+t(280,210,'Identity · image policy · isolation'); break;
    case 'configuration':
      art=t(280,22,'Configuration determines exposure')+[['Public storage','Private',30],['Broad role','Scoped',97],['Open port','Restricted',164]].map(([old,state,y])=>box(20,y+10,170,39,old)+arrow(197,y+29,335,y+29)+box(342,y+10,190,39,state,true)).join(''); break;
    case 'provenance':
      art=box(15,65,105,62,'Source')+arrow(125,96,165,96)+box(170,65,115,62,'Build')+arrow(290,96,330,96)+box(335,65,105,62,'Artifact')+arrow(445,96,475,96)+box(480,65,65,62,'Run')+
        box(180,148,95,62,'SBOM')+line(225,132,225,145)+check(388,169)+t(388,201,'Provenance'); break;
    case 'early-review':
      art=[['Design',25],['Build',205],['Run',385]].map(([name,x],i)=>box(x,85,150,65,name)+(i<2?arrow(x+155,117,x+175,117):'')).join('')+
        box(25,15,150,45,'Security review',true)+arrow(100,64,100,80)+`<path d="M460 160Q280 235 100 160"/>`+t(280,180,'Feedback throughout delivery'); break;
    case 'runtime-boundary':
      art=rect(25,17,510,183)+t(280,42,'Host boundary')+rect(65,62,280,116)+t(205,85,'Container')+box(82,105,110,48,'Non-root')+box(212,105,112,48,'Read-only')+
        box(382,79,125,49,'Host socket')+line(350,104,378,104)+cross(363,104)+t(436,165,'Capabilities',12)+cross(436,185); break;
    case 'packet-filter':
      art=box(15,85,105,50,'Packet')+arrow(125,110,175,110)+rect(180,25,200,168)+t(280,49,'Filter chain')+['Match','State','Action'].map((s,i)=>t(280,82+i*41,s)+line(200,93+i*41,360,93+i*41)).join('')+
        arrow(385,85,435,58)+arrow(385,139,435,171)+box(440,35,105,46,'Accept')+box(440,149,105,46,'Drop',true); break;
    case 'key-auth':
      art=rect(15,45,160,130)+t(95,70,'SSH client')+key(60,140)+t(95,102,'Private key',12)+arrow(182,109,373,109)+t(280,89,'Encrypted session')+box(380,45,165,130,'Server')+t(462,150,'Public key',12)+t(280,207,'Key authentication + host verification'); break;
    case 'server-posture':
      art=rect(35,25,150,170)+t(110,54,'Server')+[0,1,2].map(i=>rect(60,76+i*34,100,23)).join('')+
        [['Minimal packages',65],['Scoped accounts',110],['Patch + audit',155]].map(([s,y])=>check(260,y)+t(390,y+5,s)).join('')+t(280,213,'Reduce the attack surface deliberately'); break;
    case 'confinement':
      art=rect(30,20,335,182)+t(197,46,'Enforced security domain')+box(55,80,120,63,'Process')+arrow(180,111,220,111)+box(225,80,115,63,'Allowed file')+
        box(410,80,130,63,'Other resource')+line(370,111,405,111)+cross(390,111)+t(280,214,'Mandatory policy contains the process'); break;
    case 'vault-rotation':
      art=rect(35,28,150,160)+t(110,54,'Secret vault')+key(82,98)+check(110,153)+arrow(192,106,250,106)+box(255,75,145,62,'Workload')+
        line(257,177,532,177)+[277,397,517].map((x,i)=>dot(x,177,6)+t(x,207,['Issue','Overlap','Revoke'][i],12)).join('')+t(477,86,'Rotate',12); break;
    case 'accelerator-scheduling':
      art=t(95,23,'Queued jobs')+[0,1,2].map(i=>box(25,44+i*53,135,38,['Training','Inference','Batch'][i])).join('')+arrow(165,108,215,108)+
        rect(220,25,320,172)+t(380,51,'Accelerator allocation')+[0,1].map(i=>[0,1,2].map(j=>rect(243+j*94,75+i*58,77,41,(i+j)%3!==0)).join('')).join('')+t(380,214,'Schedule · share · reclaim idle capacity',12); break;
    case 'telemetry-pipeline':
      art=[['Logs',27],['Metrics',91],['Traces',155]].map(([s,y])=>box(15,y,108,42,s)+arrow(129,y+21,206,105)).join('')+box(212,67,140,78,'Process first',true)+arrow(358,106,405,106)+box(410,65,135,82,'Store / retain')+t(280,207,'Filter · aggregate · sample with ownership'); break;
    case 'metering-ledger':
      art=box(15,70,110,65,'Usage events')+arrow(130,102,170,102)+box(175,58,135,90,'Deduplicate',true)+arrow(315,102,355,102)+sheet(360,30,175,160)+t(448,55,'Ledger',12)+t(448,166,'Rate + reconcile',12)+t(280,211,'Traceable usage, not approximate billing'); break;
    case 'egress-boundary':
      art=rect(20,20,270,178)+t(155,46,'Cloud region')+box(43,81,108,62,'Data')+arrow(158,110,410,110)+t(336,88,'Data transfer out',12)+line(290,14,290,204,'stroke-dasharray="6 6"')+box(417,81,120,62,'Destination')+t(280,214,'Route, region and destination change the bill'); break;
    case 'unit-economics':
      art=sheet(35,45,165,139)+t(118,67,'Cloud spend')+line(242,108,527,108)+t(385,87,'Cost')+t(385,142,'Business output')+t(385,186,'Users · transactions · requests',12)+arrow(205,108,230,108)+t(280,216,'Choose the unit before judging spend'); break;
    case 'allocation':
      art=sheet(15,48,140,137)+t(85,73,'Cloud usage')+arrow(161,115,222,115)+box(228,80,112,65,'Allocate',true)+
        [27,91,155].map((y,i)=>arrow(346,113,410,y+21)+box(415,y,130,43,['Team A','Team B','Shared'][i])).join(''); break;
    case 'maturity':
      art=[['Crawl',20,125],['Walk',200,83],['Run',380,41]].map(([s,x,y],i)=>box(x,y,160,64,s,i===1)+(i<2?arrow(x+166,y+30,x+174,y-10):'')).join('')+t(280,211,'Visibility → accountability → continuous practice'); break;
    case 'commitment':
      art=t(280,24,'Match commitment to a stable workload')+line(35,173,530,173)+rect(60,70,440,53,true)+t(280,102,'Commitment term')+
        [75,280,485].map((x,i)=>line(x,161,x,185)+t(x,209,['Baseline','Review','Renew or exit'][i],12)).join('')+t(280,146,'Coverage and utilization are different questions',12); break;
    case 'practice':
      art=[[90,59,'Engineering'],[470,59,'Finance'],[280,140,'Product']].map(([x,y,s])=>person(x,y)+t(x,y+49,s)).join('')+
        line(117,63,443,63)+line(109,91,255,164)+line(451,91,305,164)+t(280,111,'Shared decisions'); break;
    case 'commitment-options':
      art=t(135,23,'Savings Plan')+t(425,23,'Reserved Instance')+box(25,50,220,74,'Spend commitment',true)+box(315,50,220,74,'Resource commitment')+
        t(135,167,'Eligible usage flexibility')+t(425,167,'Configuration fit')+line(280,35,280,201,'stroke-dasharray="5 7"')+t(280,215,'Analyze the workload before committing',12); break;
    case 'billing-analysis':
      art=sheet(20,55,125,133)+t(83,80,'Billing export',12)+arrow(152,119,207,119)+box(214,77,137,80,'BigQuery',true)+arrow(358,119,410,119)+box(417,77,128,80,'Recommendations')+t(280,212,'Labels connect spend to actionable resources',12); break;
    case 'abstraction-maintenance':
      art=box(70,20,420,47,'Application team')+box(70,88,420,47,'Platform abstraction',true)+box(70,156,420,47,'Underlying technology')+arrow(280,72,280,82)+arrow(280,140,280,150)+`<path d="M500 180Q560 110 500 44"/>`+t(36,117,'Maintain',11); break;
    case 'anomaly-response':
      art=[['Retry loop',16],['Verbose logs',195],['Idle scaling',374]].map(([s,x])=>box(x,30,165,59,s)).join('')+
        [98,277,456].map(x=>arrow(x,95,280,145)).join('')+box(190,151,180,48,'Investigate change',true)+t(280,216,'An alert starts diagnosis; it is not the explanation',12); break;
    case 'continuous-practice':
      art=[['Measure',30,37],['Review',350,37],['Improve',190,145]].map(([s,x,y])=>box(x,y,180,52,s)).join('')+arrow(217,63,342,63)+arrow(438,95,380,144)+arrow(180,168,109,96)+t(280,127,'Repeat'); break;
    case 'total-cost':
      art=t(135,24,'Public cloud')+t(425,24,'Private cloud')+sheet(57,49,155,135)+t(135,71,'Provider bill')+
        [['Hardware',50],['Power + space',97],['People + lifecycle',144]].map(([s,y])=>box(320,y,220,38,s)).join('')+line(280,35,280,205,'stroke-dasharray="5 6"')+t(280,216,'Account for the whole operating model',12); break;
    case 'named-owner':
      art=[0,1,2].map(i=>box(20,20+i*64,145,43,['Compute','Storage','Network'][i])+arrow(171,42+i*64,240,105)).join('')+
        rect(246,25,280,164)+person(387,88)+t(387,150,'Named accountable owner')+t(280,214,'Visibility needs a decision maker'); break;
    case 'showback-first':
      art=sheet(25,48,135,139)+t(92,73,'Attributed use',12)+arrow(167,116,214,116)+box(220,75,145,80,'Team discussion',true)+arrow(372,116,410,116)+box(417,75,125,80,'Accountability')+t(280,212,'Showback before chargeback'); break;
    case 'provider-allocation':
      art=[['AWS',20],['Azure',200],['GCP / OCI',380]].map(([s,x])=>box(x,26,160,74,s)+line(x+80,105,x+80,145)).join('')+
        line(100,145,460,145)+box(190,157,180,47,'Common ownership',true)+t(280,15,'Tags + shared practice',12); break;
    case 'namespace-costs':
      art=rect(20,15,520,170)+t(280,39,'Cluster cost needs workload attribution')+box(42,65,135,108,'Namespace A')+box(212,65,135,108,'Namespace B')+box(382,65,135,108,'Shared capacity')+
        t(280,209,'Requests · usage · idle capacity · labels',12); break;
    case 'resource-tags':
      art=box(35,65,155,88,'Cloud resource')+arrow(197,109,240,109)+rect(246,23,285,175)+[['Owner','Team'],['Environment','Production'],['Purpose','Workload']].map(([a,b],i)=>t(310,59+i*56,a,12)+t(447,59+i*56,b,12)+line(265,78+i*56,510,78+i*56)).join('')+t(280,215,'Enforce a small, reliable tag taxonomy',12); break;
    case 'token-routing':
      art=box(15,80,108,61,'Request')+arrow(129,110,180,110)+box(185,72,126,78,'Route',true)+arrow(316,89,370,51)+arrow(316,135,370,169)+box(375,25,170,51,'Smaller model')+box(375,145,170,51,'Larger model')+t(280,207,'Cache · budget · evaluate quality',12); break;
    case 'orphaned-resources':
      art=[0,1,2,3].map(i=>rect(30+i*135,36,110,96,i===2)+t(85+i*135,70,'VM')+t(85+i*135,108,i===2?'Owner?':'Assigned',12)).join('')+
        person(355,171)+cross(355,153)+t(155,191,'Find · verify · reclaim')+t(280,217,'A running resource is not proof of a live purpose',12); break;
    default: return null;
  }
  return `<g data-subject-detail="${xml(detail)}" stroke="${c1}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none">${art}</g>`;
}
