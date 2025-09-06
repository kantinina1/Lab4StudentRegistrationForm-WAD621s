let profiles = [];
let editingId = null;
let lastFilter = null;

function saveProfiles() {
  localStorage.setItem('profiles', JSON.stringify(profiles));
}

function loadProfiles() {
  const data = localStorage.getItem('profiles');
  if (data) {
    profiles = JSON.parse(data);
    refreshAll();
  }
}

function addEntry(data) {
  
  const card = document.createElement("div");
  card.className = "card-person";
  card.setAttribute("data-id", data.id);

  card.innerHTML = `
    <button class="remove" title="Remove">&times;</button>
    <button class="edit" title="Edit">&#9998;</button>
    <img src="${data.photo || "https://placehold.co/128"}" alt="Photo of ${data.first} ${data.last}">
    <div>
      <h3>${data.first} ${data.last}</h3>
      <p>
        <span class="badge">${data.prog}</span>
        <span class="badge">Year ${data.year}</span>
      </p>
      <p><small>${data.interests}</small></p>
    </div>
  `;
  card.querySelector(".remove").addEventListener("click", () => removeEntry(data.id));
  card.querySelector(".edit").addEventListener("click", () => startEdit(data.id));
  document.getElementById("cards").appendChild(card);


  const tr = document.createElement("tr");
  tr.setAttribute("data-id", data.id);
  tr.innerHTML = `
    <td>${data.first} ${data.last}</td>
    <td>${data.prog}</td>
    <td>${data.year}</td>
    <td>${data.interests}</td>
    <td><img src="${data.photo || "https://placehold.co/64"}" alt="Photo"></td>
    <td>
      <button class="remove-table">&times;</button>
      <button class="edit-table">&#9998;</button>
    </td>
  `;
  tr.querySelector(".remove-table").addEventListener("click", () => removeEntry(data.id));
  tr.querySelector(".edit-table").addEventListener("click", () => startEdit(data.id));
  document.querySelector("#summary tbody").appendChild(tr);
}

function removeEntry(id) {
  profiles = profiles.filter(p => p.id !== id);
  saveProfiles();
  refreshAll(lastFilter);
  document.getElementById("live").textContent = "Profile removed.";
}

function startEdit(id) {
  const p = profiles.find(p => p.id === id);
  if (!p) return;

  document.getElementById("first").value = p.first;
  document.getElementById("last").value = p.last;
  document.getElementById("email").value = p.email;
  document.getElementById("prog").value = p.prog;
  document.getElementById("interests").value = p.interests;
  document.getElementById("photo").value = p.photo;
  document.getElementById("photoPreview").src = p.photo || "https://placehold.co/128";
  if (p.year) {
    const yearRadio = document.querySelector(`input[name="year"][value="${p.year}"]`);
    if (yearRadio) yearRadio.checked = true;
  }

  editingId = id;
  document.getElementById("cancelEdit").style.display = "inline";
  document.getElementById("regForm").classList.add("edit-mode");
  document.getElementById("live").textContent = "Editing profile. Submit to save changes.";
}

function cancelEdit() {
  editingId = null;
  document.getElementById("regForm").reset();
  document.getElementById("photoPreview").src = "https://placehold.co/128";
  document.getElementById("cancelEdit").style.display = "none";
  document.getElementById("regForm").classList.remove("edit-mode");
  document.getElementById("live").textContent = "Edit cancelled.";
}

function refreshAll(filteredList = null) {
  const list = filteredList || profiles;
  lastFilter = filteredList;
  document.getElementById("cards").innerHTML = "";
  document.querySelector("#summary tbody").innerHTML = "";
  list.forEach(addEntry);
}

function highlightProfile(id) {
  const card = document.querySelector(`.card-person[data-id="${id}"]`);
  if (card) {
    card.classList.add("highlight");
    setTimeout(() => card.classList.remove("highlight"), 2000);
  }
  const tr = document.querySelector(`#summary tbody tr[data-id="${id}"]`);
  if (tr) {
    tr.classList.add("highlight");
    setTimeout(() => tr.classList.remove("highlight"), 2000);
  }
}

document.getElementById("search").addEventListener("input", function () {
  const q = this.value.trim().toLowerCase();
  const filtered = profiles.filter(profile =>
    `${profile.first} ${profile.last}`.toLowerCase().includes(q) ||
    profile.prog.toLowerCase().includes(q) ||
    (profile.interests || "").toLowerCase().includes(q)
  );
  refreshAll(filtered);
});


function validateNotEmpty(id, label) {
  const field = document.getElementById(id);
  const err = document.getElementById("err-" + id);
  if (!field.value.trim()) {
    err.textContent = `${label} is required.`;
    return false;
  }
  err.textContent = "";
  return true;
}

function validateEmail(id) {
  const field = document.getElementById(id);
  const err = document.getElementById("err-" + id);
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
  if (!ok) {
    err.textContent = "Please enter a valid email.";
    return false;
  }
  err.textContent = "";
  return true;
}

function validateYear() {
  const radios = document.getElementsByName("year");
  const err = document.getElementById("err-year");
  let checked = false;
  for (const r of radios) {
    if (r.checked) checked = true;
  }
  if (!checked) {
    err.textContent = "Select a year.";
    return false;
  }
  err.textContent = "";
  return true;
}

document.getElementById("regForm").addEventListener("submit", function (e) {
  e.preventDefault();
  let valid = true;
  valid = valid && validateNotEmpty("first", "First name");
  valid = valid && validateNotEmpty("last", "Last name");
  valid = valid && validateNotEmpty("prog", "Programme");
  valid = valid && validateNotEmpty("email", "Email") && validateEmail("email");
  valid = valid && validateYear();

  if (!valid) {
    document.getElementById("live").textContent = "Fix errors before submitting.";
    return;
  } else {
    document.getElementById("live").textContent = "";
  }

  const data = {
    first: document.getElementById("first").value.trim(),
    last: document.getElementById("last").value.trim(),
    email: document.getElementById("email").value.trim(),
    prog: document.getElementById("prog").value.trim(),
    year: document.querySelector("input[name='year']:checked").value,
    interests: document.getElementById("interests").value.trim(),
    photo: document.getElementById("photo").value.trim(),
    id: editingId || (Date.now().toString() + Math.random().toString(36).slice(2)),
  };

  const exists = profiles.some(p => p.email === data.email && p.id !== editingId);
  if (exists) {
    document.getElementById("err-email").textContent = "This email is already used.";
    return;
  }

  if (editingId) {
    const idx = profiles.findIndex(p => p.id === editingId);
    if (idx !== -1) {
      profiles[idx] = { ...data, id: editingId };
      saveProfiles();
      refreshAll(lastFilter);
      highlightProfile(editingId);
      editingId = null;
      document.getElementById("cancelEdit").style.display = "none";
      document.getElementById("regForm").classList.remove("edit-mode");
      document.getElementById("live").textContent = "Profile updated.";
    }
  } else {
    profiles.push(data);
    saveProfiles();
    refreshAll(lastFilter);
    document.getElementById("live").textContent = "Profile added successfully.";
  }

  this.reset();
  document.getElementById("photoPreview").src = "https://placehold.co/128";
});

document.getElementById("photo").addEventListener("input", function () {
  const url = this.value.trim();
  document.getElementById("photoPreview").src = url || "https://placehold.co/128";
});


["first", "last", "prog", "email"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => {
    document.getElementById("err-" + id).textContent = "";
    document.getElementById("live").textContent = "";
  });
});
document.getElementsByName("year").forEach(radio => {
  radio.addEventListener("change", () => {
    document.getElementById("err-year").textContent = "";
    document.getElementById("live").textContent = "";
  });
});


document.getElementById("cancelEdit").addEventListener("click", cancelEdit);

window.addEventListener('DOMContentLoaded', loadProfiles);
