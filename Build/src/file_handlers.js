if ("launchQueue" in window && "files" in LaunchParams.prototype) {
    window.launchQueue.setConsumer(async (launchParams) => {
      if (!launchParams.files || launchParams.files.length === 0) return;
  
      // Open all files provided (let manifest file_handlers restrict type/extension)
      for (const fileHandle of launchParams.files) {
        try {
          const file = await fileHandle.getFile();
          window.readFile(file);
        } catch (err) {
          alert(`Failed to open file: ${err}`);
        }
      }
    });
  }