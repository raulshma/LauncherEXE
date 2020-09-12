const { dialog } = require('electron').remote;
const { shell, ipcRenderer } = require('electron');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

let allData = [];
let progressBarEle;
let currentProgressEle;
//Log file path
const logFilePath = `${__dirname}\\logs\\log.txt`;

window.addEventListener('DOMContentLoaded', () => {
  let globalState = {};
  progressBarEle = document.querySelector('.progress');
  currentProgressEle = progressBarEle.querySelector('.determinate');
  //Get file elements
  const {
    addBtn,
    addBtnIcon,
    fileDesc,
    fileIcon,
    fileElement,
    fileName,
    fileDir,
    fileExe,
  } = getFileElements();

  //Add button click event listener
  addBtn.addEventListener('click', async (event) => {
    //Check if already clicked
    if (addBtnIcon.innerText === 'check') {
      //Add item to file
      globalState = await handleItemAdd({
        globalState,
        fileDesc,
        fileIcon,
        fileElement,
        addBtnIcon,
      });
    } else {
      //Prompt user to select a file
      handleDialogOpen({
        globalState,
        fileName,
        fileDir,
        fileExe,
        fileElement,
        addBtnIcon,
      });
    }
  });
  //Get and display all data in file on load
  allData = readJSON('data\\data.json');
  if (!!allData) attachCards(allData);
});

ipcRenderer.on('download progress', (event, { percent }) => {
  // console.log(progress); // Progress in fraction, between 0 and 1
  // const progressInPercentages = progress * 100; // With decimal point and a bunch of numbers
  const cleanProgressInPercentages = Math.floor(percent * 100); // Without decimal point

  console.log(cleanProgressInPercentages);
  currentProgressEle.style.width = `${cleanProgressInPercentages}%`;
  if (cleanProgressInPercentages === 100) progressBarEle.classList.add('hide');
});
ipcRenderer.on('download complete', (event, file) => {
  // console.log(file); // Full file path
});
//HELPERS
const readJSON = (path) => {
  try {
    const data = fs.readFileSync(`${__dirname}\\${path}`, 'utf8');
    return JSON.parse(data).data;
  } catch (e) {
    return [];
  }
};

const writeJSON = (path, data) => {
  try {
    const jsonString = JSON.stringify(data);
    fs.writeFileSync(`${__dirname}\\${path}`, jsonString);
  } catch (e) {
    const newLog = `INFO ||\t\t Write Error \t\t ${e} \t\t ${new Date().toISOString()}\n`;
    fs.appendFileSync(logFilePath, newLog);
    return false;
  }
};

//Display Cards function
// TODO: Create a webcomponent for the card
const attachCards = (ALL_CARDS) => {
  const cardContainer = document.getElementById('containCards');
  cardContainer.classList.add('scale-transition', 'scale-out', 'scale-in');
  cardContainer.innerHTML = '';
  let i = 1;
  //Loop through all the available cards
  for (let c of ALL_CARDS) {
    //Create html element for the card and populate its inner text and set styles
    const card = document.createElement('div');
    card.classList.add('col', 'xs12', 's6', 'm4', 'l3', 'xl2');

    const card__depth1 = document.createElement('div');
    card__depth1.classList.add('card', 'hoverable');
    let card__image;
    card__image = document.createElement('div');
    Object.assign(card__image.style, {
      backgroundImage: `url(${c.icon})`,
      backgroundSize: `cover`,
      backgroundPosition: `center`,
      minHeight: '200px',
      height: '200px',
    });
    card__image.classList.add('card-image');

    const card__depth2 = document.createElement('div');
    card__depth2.classList.add('card-content');

    const cardTitle = document.createElement('title');
    cardTitle.classList.add('card-title', 'font-italic');
    cardTitle.innerText = c.title;

    const cardText = document.createElement('p');
    cardText.classList.add('card-text', 'pb-1', 'card_p_fixed');
    cardText.innerText = c.description;

    const linkContainer = document.createElement('div');
    linkContainer.classList.add('card-action', 'pl-0', 'pb-0', 'pr-0');

    const cardLink = document.createElement('a');
    cardLink.href = '#';
    cardLink.innerHTML = 'Open';
    cardLink.setAttribute('ariaLabel', c.title);
    cardLink.classList.add(
      'waves-effect',
      'waves-light',
      'w-full',
      'btn',
      'btn-primary',
      'btn-large'
    );

    //Add click event listener on the open link in order to open the selected executable
    cardLink.addEventListener('click', (e) => {
      //Confirm dialog box
      dialog
        .showMessageBox({
          type: 'question',
          title: e.target.attributes[1].value ?? 'Confirm',
          message: 'Are you sure you want to open it?',
          buttons: ['Ok', 'Cancel'],
          cancelId: 1,
        })
        .then((e) => {
          //If response === 0 i.e ok button on the confirm dialog
          if (e.response === 0) {
            //Open the file or log if error
            shell.openExternal(`${c.dir}\\${c.exe}`).catch((e) => {
              const newLog = `ERROR ||\t\t ${e} \t\t ${
                c.title
              } \t\t ${new Date().toISOString()}\n`;
              fs.appendFileSync(logFilePath, newLog);
            });
          }
          //If cancel button was pressed on the confirm dialog then log that to the file
          if (e.response === 1) {
            const newLog = `INFO ||\t\t Cancelled \t\t ${
              c.title
            } \t\t ${new Date().toISOString()}\n`;
            fs.appendFileSync(logFilePath, newLog);
          }
        });
    });
    linkContainer.appendChild(cardLink);

    //Append Everything to the column div
    card.appendChild(card__depth1);
    card__depth1.appendChild(card__image);
    card__depth1.appendChild(card__depth2);
    card__depth2.appendChild(cardTitle);
    card__depth2.appendChild(cardText);
    card__depth2.appendChild(linkContainer);
    cardContainer.appendChild(card);
  }
};

const handleDialogOpen = ({
  globalState,
  fileName,
  fileDir,
  fileExe,
  fileElement,
  addBtnIcon,
}) => {
  dialog
    .showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Executables', extensions: ['exe'] }],
    })
    .then((data) => {
      const path = data.filePaths[0];
      if (!!path) {
        globalState.dir = path.substr(0, path.lastIndexOf('\\'));
        globalState.exe = path.substr(path.lastIndexOf('\\') + 1, path.length);
        globalState.name = globalState.exe
          .substr(0, globalState.exe.lastIndexOf('.'))
          .toUpperCase();
        fileName.innerText = `: ${globalState.name}`;
        fileDir.innerText = `: ${globalState.dir}`;
        fileExe.innerText = `: ${globalState.exe}`;
        fileElement.classList.remove('hide');
        fileElement.classList.add(['d-flex', 'flex-column']);
        addBtnIcon.innerText = 'check';
      }
    });
};

const handleItemAdd = async ({
  globalState,
  fileDesc,
  fileIcon,
  fileElement,
  addBtnIcon,
}) => {
  progressBarEle.classList.remove('hide');

  globalState.desc = fileDesc.value;
  globalState.icon = fileIcon.value;
  if (!!globalState.desc && !!globalState.icon) {
    const iconFileName = `${uuidv4()}${globalState.icon.substr(
      globalState.icon.lastIndexOf('.'),
      globalState.icon.length
    )}`;
    const iconFileDirectory = `${__dirname}/images`;

    await ipcRenderer.invoke('download', {
      url: globalState.icon,
      properties: {
        directory: iconFileDirectory,
        filename: iconFileName,
      },
    });

    fileElement.classList.add('hide');
    allData.push({
      title: globalState.name,
      description: globalState.desc,
      dir: globalState.dir,
      icon: `images/${iconFileName}`,
      exe: globalState.exe,
    });
    writeJSON('data\\data.json', { data: allData });
    //Reload the view
    attachCards(allData);
    M.toast({ html: `${globalState.name} Added` });
    globalState = {};
  }
  addBtnIcon.innerText = 'add';
  return globalState;
};

const getFileElements = () => {
  const fileElement = document.getElementById('fileElement');
  const fileName = document
    .getElementById('file__name')
    .querySelectorAll('span')[1];
  const fileDir = document
    .getElementById('file__dir')
    .querySelectorAll('span')[1];
  const fileExe = document
    .getElementById('file__exe')
    .querySelectorAll('span')[1];
  const fileDesc = document.getElementById('file__desc');
  const fileIcon = document.getElementById('file__icon');

  //Get add new exe button
  const addBtn = document.getElementById('addBtn');
  const addBtnIcon = addBtn.querySelector('i');
  return {
    addBtn,
    addBtnIcon,
    fileDesc,
    fileIcon,
    fileElement,
    fileName,
    fileDir,
    fileExe,
  };
};
