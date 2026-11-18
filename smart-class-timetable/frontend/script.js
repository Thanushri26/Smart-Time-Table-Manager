// ============ DATA ============
const subjects = ['DBMS','OS','CN','ML','DSA','Web Dev','AI','Cloud','Maths','English'];
const faculty = [
  {id:1,name:'Dr. Sharma',subjects:['DBMS','DSA'],workload:0},
  {id:2,name:'Prof. Patel',subjects:['OS','CN'],workload:0},
  {id:3,name:'Dr. Kumar',subjects:['ML','AI'],workload:0},
  {id:4,name:'Ms. Reddy',subjects:['Web Dev','Cloud'],workload:0},
  {id:5,name:'Dr. Singh',subjects:['DSA','AI','Maths'],workload:0},
  {id:6,name:'Prof. Nair',subjects:['CN','Cloud'],workload:0},
  {id:7,name:'Ms. Iyer',subjects:['English','Maths'],workload:0}
];
const timeSlots = ['9:00-10:00','10:00-11:00','11:15-12:15','1:00-2:00','2:00-3:00','3:15-4:15'];
const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
let timetableData = {};
let currentReplaceCell = null;
let currentEditCell = null;
let students = [
  {id:'S101',name:'Aarav',attendance:'present'},
  {id:'S102',name:'Priya',attendance:'present'},
  {id:'S103',name:'Rahul',attendance:'absent'},
  {id:'S104',name:'Sneha',attendance:'present'},
  {id:'S105',name:'Vikram',attendance:'present'},
];

// ============ INIT ============
function init(){ renderFacultyPool(); createEmptyTimetable(); renderStudents(); updateStats(); }
function renderFacultyPool(){
  document.getElementById('facultyPool').innerHTML = faculty.map(f=>
    `<div class="faculty-card" draggable="true" data-faculty-id="${f.id}" ondragstart="dragStart(event)">${f.name}<small>${f.subjects.join(', ')}</small></div>`).join('');
}
function createEmptyTimetable(){
  document.getElementById('timetableBody').innerHTML = timeSlots.map(time=>`
    <tr><td class="time-col">${time}</td>
    ${days.map(day=>`<td><div class="slot" data-day="${day}" data-time="${time}" ondrop="drop(event)" ondragover="allowDrop(event)" ondragleave="dragLeave(event)"></div></td>`).join('')}
    </tr>`).join('');
}

// ============ GENERATE ============
async function generateTimetable(){
  // Try backend first, fallback to local
  try{
    const res = await fetch('http://localhost:5000/generate',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({class_id:document.getElementById('classSelect').value, faculty, subjects, days, timeSlots})
    });
    const data = await res.json();
    timetableData = data.timetable;
    document.getElementById('mlOutput').innerText = data.message;
  }catch(e){
    // Local Greedy ML-like Algorithm
    timetableData={}; faculty.forEach(f=>f.workload=0);
    timeSlots.forEach(time=>{ days.forEach(day=>{
      const key=`${day}-${time}`;
      const subject=subjects[Math.floor(Math.random()*subjects.length)];
      const eligible=faculty.filter(f=>f.subjects.includes(subject)).sort((a,b)=>a.workload-b.workload);
      if(eligible.length>0){
        const s=eligible[0]; s.workload++;
        timetableData[key]={subject,faculty:s.name,facultyId:s.id,room:'Room '+(300+Math.floor(Math.random()*5)),attendance:Math.random()>0.2?'present':'absent'};
      }
    })});
    document.getElementById('mlOutput').innerText='Timetable generated locally (Backend not connected). Workload-balanced algorithm used.';
  }
  renderTimetable(); updateStats();
}
function renderTimetable(){
  document.querySelectorAll('.slot').forEach(slot=>{
    const key=`${slot.dataset.day}-${slot.dataset.time}`; const d=timetableData[key];
    if(d){
      let attClass = d.attendance==='predicted' ? 'predicted' : d.attendance;
      let attText = d.attendance==='predicted' ? '⚠ High Risk' : (d.attendance==='present'?'✓ Present':'✗ Absent');
      slot.innerHTML=`<div class="subject">${d.subject}</div><div class="faculty">${d.faculty}</div><div class="room">${d.room||''}</div>
      <div class="attendance ${attClass}" onclick="toggleAttendance('${key}')">${attText}</div>
      <div class="slot-actions">
        <button class="slot-btn" onclick="openReplaceModal('${key}')">Replace</button>
        <button class="slot-btn" onclick="openEditModal('${key}')">Edit</button>
        <button class="slot-btn danger" onclick="deleteSlot('${key}')">Del</button>
      </div>`;
    } else slot.innerHTML='<div style="color:#999;font-size:12px">Empty<br><button class="slot-btn" onclick="addSlot(this)">+ Add</button></div>';
  });
}
function addSlot(el){
  const slot = el.closest('.slot');
  const key=`${slot.dataset.day}-${slot.dataset.time}`;
  timetableData[key]={subject:'DBMS',faculty:faculty[0].name,facultyId:1,room:'Room 301',attendance:'present'};
  renderTimetable(); updateStats();
}

// ============ DRAG & DROP ============
function dragStart(e){ e.dataTransfer.setData('facultyId',e.target.dataset.facultyId); }
function allowDrop(e){ e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
function dragLeave(e){ e.currentTarget.classList.remove('drag-over'); }
function drop(e){
  e.preventDefault(); e.currentTarget.classList.remove('drag-over');
  const fid=e.dataTransfer.getData('facultyId'); const nf=faculty.find(f=>f.id==fid);
  const key=`${e.currentTarget.dataset.day}-${e.currentTarget.dataset.time}`;
  if(timetableData[key]){ timetableData[key].faculty=nf.name; timetableData[key].facultyId=nf.id; }
  else timetableData[key]={subject:nf.subjects[0],faculty:nf.name,facultyId:nf.id,room:'Room 301',attendance:'present'};
  // Sync to backend
  fetch('http://localhost:5000/replace-faculty',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slot:key,new_faculty:nf.name})}).catch(()=>{});
  renderTimetable(); updateStats();
}

// ============ ATTENDANCE ============
function toggleAttendance(key){ if(timetableData[key]){ timetableData[key].attendance=timetableData[key].attendance==='present'?'absent':'present'; renderTimetable(); updateStats(); } }
function renderStudents(){
  document.getElementById('studentList').innerHTML = students.map((s,i)=>`
    <div class="student-row"><span><b>${s.id}</b> - ${s.name}</span>
    <span class="attendance ${s.attendance}" onclick="toggleStudent(${i})">${s.attendance==='present'?'✓ Present':'✗ Absent'} (Click to Edit)</span></div>`).join('');
}
function toggleStudent(i){ students[i].attendance = students[i].attendance==='present'?'absent':'present'; renderStudents(); updateStats(); }

// ============ ML PREDICT ============
async function predictAttendance(){
  document.getElementById('mlOutput').innerText='Running ML Model...';
  try{
    const res=await fetch('http://localhost:5000/predict',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(timetableData)});
    const data=await res.json();
    document.getElementById('mlOutput').innerText=data.message;
    document.getElementById('mlDetails').innerHTML=`<p style="margin-top:8px;font-size:13px">Model: ${data.model} | Accuracy: ${data.accuracy} | High Risk: ${data.high_risk_count}</p>`;
    // Update UI
    Object.keys(data.predictions||{}).forEach(k=>{ if(data.predictions[k]==='High Risk' && timetableData[k]) timetableData[k].attendance='predicted'; });
    renderTimetable(); updateStats();
  }catch(e){ document.getElementById('mlOutput').innerText='Backend not running! Run: python backend/app.py first. Showing local fallback.'; }
}

// ============ BIOMETRIC ============
async function simulateBiometric(){
  const randomStudent = students[Math.floor(Math.random()*students.length)];
  randomStudent.attendance='present';
  renderStudents();
  try{
    await fetch('http://localhost:5000/biometric',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({student_id:randomStudent.id,status:'present'})});
    document.getElementById('mlOutput').innerText=`Biometric Scan Successful: ${randomStudent.name} (${randomStudent.id}) marked Present automatically.`;
  }catch(e){ document.getElementById('mlOutput').innerText=`Biometric Scan: ${randomStudent.name} marked Present (Local mode)`; }
  updateStats();
}

// ============ REPLACE / EDIT ============
function openReplaceModal(key){ currentReplaceCell=key; document.getElementById('replaceModal').style.display='flex';
  document.getElementById('newFaculty').innerHTML=faculty.map(f=>`<option value="${f.id}">${f.name}</option>`).join('');
  document.getElementById('newSubject').innerHTML=subjects.map(s=>`<option value="${s}">${s}</option>`).join('');
}
function confirmReplace(){
  const fid=document.getElementById('newFaculty').value; const sub=document.getElementById('newSubject').value; const nf=faculty.find(f=>f.id==fid);
  if(currentReplaceCell && timetableData[currentReplaceCell]){ timetableData[currentReplaceCell].faculty=nf.name; timetableData[currentReplaceCell].facultyId=nf.id; timetableData[currentReplaceCell].subject=sub; renderTimetable(); updateStats(); }
  closeModal();
}
function closeModal(){ document.getElementById('replaceModal').style.display='none'; }
function openEditModal(key){ currentEditCell=key; document.getElementById('editModal').style.display='flex';
  document.getElementById('editSubject').innerHTML=subjects.map(s=>`<option value="${s}">${s}</option>`).join('');
}
function confirmEdit(){
  const sub=document.getElementById('editSubject').value; const room=document.getElementById('editRoom').value;
  if(currentEditCell && timetableData[currentEditCell]){ timetableData[currentEditCell].subject=sub; if(room) timetableData[currentEditCell].room=room; renderTimetable(); }
  closeEditModal();
}
function closeEditModal(){ document.getElementById('editModal').style.display='none'; }
function deleteSlot(key){ delete timetableData[key]; renderTimetable(); updateStats(); }
function clearTimetable(){ timetableData={}; renderTimetable(); updateStats(); }
function updateStats(){
  const total=Object.keys(timetableData).length;
  const present=Object.values(timetableData).filter(d=>d.attendance==='present').length;
  const highRisk=Object.values(timetableData).filter(d=>d.attendance==='predicted').length;
  document.getElementById('totalClasses').innerText=total;
  document.getElementById('avgAttendance').innerText=(total>0?Math.round(present/total*100):0)+'%';
  document.getElementById('highRisk').innerText=highRisk;
  let conf=0; const m={};
  Object.keys(timetableData).forEach(k=>{ const t=k.split('-')[1]; const k2=`${t}-${timetableData[k].facultyId}`; if(m[k2]) conf++; m[k2]=true; });
  document.getElementById('conflicts').innerText=conf;
}
function exportData(){ const b=new Blob([JSON.stringify({timetable:timetableData,students},null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='timetable.json'; a.click(); }
init();