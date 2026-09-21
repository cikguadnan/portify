import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const fb=initializeApp(firebaseConfig), auth=getAuth(fb), db=getFirestore(fb);
const defaults={name:"",headline:"Student • Learner • Dreamer",about:"",school:"",level:"",studentClass:"",aspiration:"",skills:"",photoURL:"",onboardingComplete:false,theme:"modern",experiences:[],published:false,slug:""};
let data={...defaults}, user=null, timer=null;
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const slugify=s=>String(s||"student").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"student";
const esc=s=>String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const initials=()=>data.name.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"P";

function message(msg,bad=false){const el=$("#authMsg");el.textContent=msg;el.style.color=bad?"#b42318":"#20a66a"}
async function load(){
 const snap=await getDoc(doc(db,"portfolios",user.uid));
 if(snap.exists()) data={...defaults,...snap.data()};
 else {data={...defaults,name:user.displayName||"",slug:slugify(user.displayName||"student")};await saveNow()}
 sync();
}
async function saveNow(extra={}){
 if(!user)return;
 data.slug=data.slug||slugify(data.name);
 await setDoc(doc(db,"portfolios",user.uid),{...data,...extra,ownerId:user.uid,email:user.email,updatedAt:serverTimestamp()},{merge:true});
 await setDoc(doc(db,"users",user.uid),{email:user.email,name:data.name,role:"student",updatedAt:serverTimestamp()},{merge:true});
 $("#saveState").textContent="Saved to cloud ✓";
}
function queueSave(){ $("#saveState").textContent="Saving…";clearTimeout(timer);timer=setTimeout(()=>saveNow().catch(e=>{$("#saveState").textContent="Save failed";console.error(e)}),650)}
function siteHTML(){
 const style=data.theme==="dark"?"background:#11182a;color:#f8faff":data.theme==="minimal"?"background:#fff;color:#161b26":"";
 const hero=data.theme==="dark"?"background:linear-gradient(135deg,#11182a,#332b58);color:white":data.theme==="minimal"?"background:#fafafa":"";
 return '<div style="'+style+'"><div class="hero" style="'+hero+'"><div><span class="pill">STUDENT PORTFOLIO</span><h3>Hi, I’m '+esc(data.name||"Your Name")+'.</h3><b>'+esc(data.headline)+'</b><p>'+esc(data.about||"Tell visitors a little about yourself.")+'</p></div><div class="avatar">'+esc(initials())+'</div></div><div class="miniSection"><b>My direction</b><h3 style="margin:6px 0 14px">'+esc(data.aspiration||"My future direction")+'</h3><div class="chips">'+data.skills.split(",").filter(Boolean).map(s=>'<span class="chip">'+esc(s.trim())+'</span>').join("")+'</div></div></div>'
}
function renderPreview(){$("#sitePreview").innerHTML=siteHTML();$("#themePreview").innerHTML=siteHTML()}
function renderExp(){
 $("#experienceList").innerHTML=data.experiences.length?data.experiences.map((e,i)=>'<div class="exp"><div class="expIcon">'+({CCA:"⚽",Leadership:"👥","VIA / Community":"♥",Achievement:"🏆",Project:"💡"}[e.type]||"★")+'</div><div style="flex:1"><h4>'+esc(e.title)+' <span style="font-size:11px;color:#777;font-weight:500">• '+esc(e.year)+'</span></h4><p><b>'+esc(e.type)+'</b> — '+esc(e.text)+'</p></div><button class="btn" data-remove="'+i+'">Delete</button></div>').join(""):'<div class="empty">No experiences yet. Add your first one.</div>';
 $("#expCount").textContent=data.experiences.length;
 $$("[data-remove]").forEach(b=>b.onclick=()=>{data.experiences.splice(+b.dataset.remove,1);renderExp();renderStats();queueSave()});
}
function renderStats(){const skills=data.skills.split(",").filter(x=>x.trim()).length;$("#skillCount").textContent=skills;const fields=["name","headline","about","school","aspiration","skills"].filter(k=>(data[k]||"").trim()).length;const pct=Math.min(100,Math.round((fields/6*.7+Math.min(data.experiences.length,3)/3*.3)*100));$("#completion").textContent=pct+"%";$("#progressBar").style.width=pct+"%"}
function sync(){["name","headline","about","school","level","studentClass","aspiration","skills"].forEach(k=>$("#"+k).value=data[k]||"");$$(".theme").forEach(b=>b.classList.toggle("active",b.dataset.theme===data.theme));renderPreview();renderExp();renderStats();$("#publishedBadge").textContent=data.published?"Published":"Draft";$("#userEmail").textContent=user?.email||"";$("#googleAvatar").src=data.photoURL||user?.photoURL||"https://ui-avatars.com/api/?name="+encodeURIComponent(data.name||"Student") }
function showApp(logged){$("#authScreen").style.display=logged?"none":"grid";$("#appShell").style.display=logged?"grid":"none"}
onAuthStateChanged(auth,async u=>{user=u;showApp(!!u);if(u){try{await load()}catch(e){alert("Could not load portfolio: "+e.message)}}});
function showOnboarding(){const m=$("#onboardingModal");$("#onboardGoogleName").textContent=user?.displayName||"Student";$("#onboardEmail").textContent=user?.email||"";$("#onboardName").value=data.name||user?.displayName||"";$("#onboardSchool").value=data.school||"";$("#onboardLevel").value=data.level||"";$("#onboardClass").value=data.studentClass||"";$("#onboardAspiration").value=data.aspiration||"";$("#onboardAvatar").src=data.photoURL||user?.photoURL||"";m.classList.add("show")}
$("#finishOnboarding").onclick=async()=>{const n=$("#onboardName").value.trim();if(!n)return alert("Please add your preferred name.");data.name=n;data.school=$("#onboardSchool").value.trim();data.level=$("#onboardLevel").value;data.studentClass=$("#onboardClass").value.trim();data.aspiration=$("#onboardAspiration").value.trim();data.photoURL=data.photoURL||user?.photoURL||"";data.slug=slugify(data.name);data.onboardingComplete=true;await saveNow();$("#onboardingModal").classList.remove("show");sync()};
$("#googleSignIn").onclick=async()=>{try{message("Opening Google sign-in…");const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:"select_account"});await signInWithPopup(auth,provider);message("")}catch(e){message(e.message,true)}};
$("#signOut").onclick=()=>signOut(auth);
["name","headline","about","school","level","studentClass","aspiration","skills"].forEach(k=>$("#"+k).addEventListener("input",e=>{data[k]=e.target.value;if(k==="name"&&!data.published)data.slug=slugify(data.name);renderPreview();renderStats();queueSave()}));
$$(".nav button").forEach(b=>b.onclick=()=>{$$(".nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".page").forEach(x=>x.classList.remove("active"));$("#"+b.dataset.page).classList.add("active");const t={profile:["Build your portfolio","Your work is now saved securely to your account."],experiences:["Your experiences","Show what you have done — and what you learned."],themes:["Make it yours","Choose a style without worrying about web design."],publish:["Share your portfolio","Publish your portfolio when you are ready."]}[b.dataset.page];$("#pageTitle").textContent=t[0];$("#pageSub").textContent=t[1]});
$$(".theme").forEach(b=>b.onclick=()=>{data.theme=b.dataset.theme;sync();queueSave()});
$("#addExp").onclick=()=>$("#expModal").classList.add("show");$$("[data-close]").forEach(b=>b.onclick=()=>b.closest(".modal").classList.remove("show"));
$("#saveExp").onclick=()=>{const title=$("#expTitle").value.trim();if(!title)return alert("Add a title first.");data.experiences.unshift({title,type:$("#expType").value,year:$("#expYear").value,text:$("#expText").value});$("#expModal").classList.remove("show");$("#expTitle").value="";$("#expText").value="";renderExp();renderStats();queueSave()};
async function publish(){if(!data.name.trim())return alert("Add your name before publishing.");data.slug=slugify(data.name);data.published=true;await saveNow({published:true,publishedAt:serverTimestamp()});sync();const base=location.origin+location.pathname.replace(/[^/]*$/,"");const url=base+"portfolio.html?slug="+encodeURIComponent(data.slug);$("#shareUrl").textContent=url;$("#publishModal").classList.add("show");$("#viewPortfolio").onclick=()=>window.open(url,"_blank")}
$("#publishTop").onclick=publish;$("#publishMain").onclick=publish;$("#copyLink").onclick=async()=>{await navigator.clipboard.writeText($("#shareUrl").textContent);$("#copyLink").textContent="Copied ✓"};
