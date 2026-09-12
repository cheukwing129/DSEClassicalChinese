import {ensureLogin,auth} from './firebase-config.js';

function withTimeout(promise,ms,label){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(`${label} timeout`)),ms))]);}
async function authorized(path,options={}){
  const uid=await ensureLogin();
  if(!uid||!auth||!auth.currentUser)throw new Error('Firebase authentication unavailable');
  const token=await withTimeout(auth.currentUser.getIdToken(),8000,'Firebase ID token');
  const response=await withTimeout(fetch(path,{...options,headers:{...(options.body?{'content-type':'application/json'}:{}),...(options.headers||{}),authorization:`Bearer ${token}`}}),12000,'practice API');
  let data=null;try{data=await response.json()}catch(_){}
  if(!response.ok){const error=new Error(data&&data.error?data.error:`practice API ${response.status}`);error.status=response.status;throw error}
  return data;
}
export async function submitPracticeSession(session){return authorized('/api/practice-session',{method:'POST',body:JSON.stringify(session)})}
export async function fetchPracticeState(){return authorized('/api/practice-state')}
