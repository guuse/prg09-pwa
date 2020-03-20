let baseUrl = 'https://cmgt.hr.nl:8000/';
let onlineStatus = document.getElementById('onlineStatus');
let ProjectsDom = document.getElementById('projects');
let TagsDom = document.getElementById('tagSelector');
let online = window.navigator.onLine;
let tag = '';
let projectDb;
let storeFields = [
    'title',
    'description',
    'headerImage'
];

window.addEventListener('load', event => {
    if ('serviceWorker' in navigator) {
        try {
            navigator.serviceWorker.register('serviceWorker.js');
            console.log('Service worker, running...')
        } catch (e) {
            console.log(e);
        }
    }
    onlineStatus.innerHTML = (online ? "Online ✅" : "Offline ❌");
    initiateData()
});

async function initiateData() {
    await initiateIndexDb();
    await getTags();
    getProjects();
    TagsDom.addEventListener('change', event => {
        tag = event.target.value;
        getProjects()
    });
}

async function initiateIndexDb () {
    if (!('indexedDB' in window)) {
        console.log('This browser doesn\'t support IndexedDB');
        return;
    }

    let IDBRequest = window.indexedDB.open('project-db', 1);

    IDBRequest.onerror = function (error) {
        console.log(error);
    };

    IDBRequest.onsuccess = function(event) {
        console.log('IndexedDB initialized');
        projectDb = IDBRequest.result;

        if (!projectDb.objectStoreNames.contains('projects', {keyPath: 'id'})) {
            let projectStore = projectDb.createObjectStore('projects', {keyPath: 'id'});
            storeFields.forEach(field => {
                projectStore.createIndex(field,field)
            });
            console.log('Project store initialized');
        }
    };

    IDBRequest.onupgradeneeded = function(event) {
        projectDb = event.target.result;

        projectDb.onerror = function(error) {
            console.log(error);
        };

        if (!projectDb.objectStoreNames.contains('projects', {keyPath: 'id'})) {
            let projectStore = projectDb.createObjectStore('projects', {keyPath: 'id'});
            storeFields.forEach(field => {
                projectStore.createIndex(field,field)
            });
            console.log('Project store initialized');
        }
    };

}

async function getProjects() {
    let responseProjects = await fetch(baseUrl + 'api/projects/?tag=' + tag);
    let dataProjects = await responseProjects.json();
    let projects = dataProjects['projects'];
    if (projects.length > 0) {
        projectsToDb(projects);
    }
    projectsToDom(projects);
}

async function getTags() {
    if (online) {
        let responseTags = await fetch(baseUrl + 'api/projects/tags/');
        let dataResponseTags = await responseTags.json();
        await tagsToDom(dataResponseTags['tags']);
    }
    else {
        TagsDom.innerHTML = `<option value="">No internet detected, filters can't be loaded</option>`
    }
}

function projectsToDb(projects) {
        let tx = projectDb.transaction('projects', 'readwrite');
        let store = tx.objectStore('projects');

        projects.forEach(project => {
            let projectItem = {
                id: project._id,
                title: project.title,
                description: project.description,
                headerImage: project.headerImage
            };
            store.put(projectItem);
        });

        return tx.complete;
}

function projectsToDom(projects) {
    ProjectsDom.innerHTML = projects.map(projectElement).join('\n');
}

async function tagsToDom(tags) {
    tags.forEach(tag => {
            let opt = document.createElement('option');
            opt.appendChild( document.createTextNode(tag) );
            opt.value = tag;
            TagsDom.appendChild(opt);
        }
    );
}

function projectElement(project) {
    return `
        <div class="project" id="${project._id}">
            <div class="project__image-wrapper">
                <img class="project__image" src="${baseUrl + project.headerImage}" alt="">
            </div>
            <h2 class="project__title">${project.title}</h2>
            <p class="project__description">${project.description}</p>
        </div>
    `
}
