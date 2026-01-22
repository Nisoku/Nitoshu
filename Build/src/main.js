const editor = document.getElementById("editor");
const fileInput = document.getElementById("file-input");
const filenameInput = document.getElementById("filename-input");
const charCount = document.getElementById("char-count");
const saveStatus = document.getElementById("save-status");

editor.addEventListener("input", () => {
  const len = editor.value.length;
  charCount.textContent = `${len} character${len !== 1 ? "s" : ""}`;
  saveStatus.textContent = "Unsaved changes";
});

function triggerLoad() {
  fileInput.click();
}

function loadFile(input) {
  const file = input.files[0];
  if (!file) return;
  readFile(file);
}

// Drag and Drop Support
document.body.addEventListener("dragover", (e) => {
  e.preventDefault();
  editor.style.backgroundColor = "#f9f9f9";
});

document.body.addEventListener("dragleave", (e) => {
  e.preventDefault();
  editor.style.backgroundColor = "#ffffff";
});

document.body.addEventListener("drop", (e) => {
  e.preventDefault();
  editor.style.backgroundColor = "#ffffff";
  if (e.dataTransfer.files.length > 0) {
    readFile(e.dataTransfer.files[0]);
  }
});

function readFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    editor.value = e.target.result;
    filenameInput.value = file.name;
    const len = editor.value.length;
    charCount.textContent = `${len} character${len !== 1 ? "s" : ""}`;
    saveStatus.textContent = "Loaded: " + file.name;
  };
  reader.readAsText(file);
}

function saveFile() {
  const content = editor.value;
  const filename = filenameInput.value || "Untitled.txt";

  const blob = new Blob([content], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(link.href), 100);
  saveStatus.textContent = "Saved to Downloads";

  setTimeout(() => {
    saveStatus.textContent = "Ready";
  }, 2000);
}

// Keyboard Shortcuts

document.addEventListener("keydown", (e) => {
  // Save: Ctrl+S or Cmd+S
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    saveFile();
  }
  // Open: Ctrl+O or Cmd+O
  if ((e.ctrlKey || e.metaKey) && e.key === "o") {
    e.preventDefault();
    triggerLoad();
  }
});
