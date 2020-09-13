const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;

const removeItem = (id) => {
  dialog
    .showMessageBox({
      type: 'question',
      title: 'Confirm',
      message: 'Are you sure you want to delete it?',
      buttons: ['Confirm', 'Cancel'],
      cancelId: 1,
    })
    .then((e) => {
      if (e.response === 0) {
        ipcRenderer.invoke('remove item', {
          id,
        });
      }
    });
};
