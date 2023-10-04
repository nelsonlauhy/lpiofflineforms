import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    doc,
    getDoc,
    runTransaction,
    updateDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDPdSxWBwKoCCnEJE7UmQ0kXZnWCe-xNGI",
    authDomain: "lpiforms.firebaseapp.com",
    projectId: "lpiforms",
    storageBucket: "lpiforms.appspot.com",
    messagingSenderId: "29177300011",
    appId: "1:29177300011:web:c5206f132680e65e54966e",
    measurementId: "G-YW1B3N6KRB"
};
  
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

$(document).ready(function() {
    $('#myForm').on('submit', function(e) {
        // Prevent the form from submitting immediately
        e.preventDefault();

        // Disable the submit button and show the loading spinner
        $('#submitButton').prop('disabled', true);
        $('#loadingSpinner').show();

        // If you're making an AJAX call or any async task, you would put that here
        // For now, we'll just simulate a delay and then submit the form
        setTimeout(function() {
            $('#myForm').off('submit').submit();
        }, 2000); // This 2000ms (2 seconds) delay is just for simulation, remove it when you implement the real submission logic
    });
});


document.getElementById('myForm').addEventListener('submit', handleFormSubmission);

async function saveToFirebase(data) {
    const imageFile = document.getElementById('fileInput').files[0];

    if (imageFile) {
        // Image upload logic to Firebase Storage
        const storageRef = ref(storage, 'formSubmission/' + imageFile.name);

        try {
            const snapshot = await uploadBytesResumable(storageRef, imageFile);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            console.log('Image uploaded! File available at', downloadURL);
            
            // Add image URL to data
            data.imageUrl = downloadURL;

            // Continue with Firestore logic
            await saveFormDataToFirestore(data);

        } catch (error) {
            console.error("Error uploading image:", error);
        }

    } else {
        await saveFormDataToFirestore(data);
    }
}

async function saveFormDataToFirestore(data) {
    const metaDataRef = doc(db, "metaData", "RecordID");

    // Use transactions to ensure atomicity
    const newDocID = await runTransaction(db, async (transaction) => {
        const metaDataSnapshot = await transaction.get(metaDataRef);
        if (!metaDataSnapshot.exists) {
            throw "Metadata document does not exist!";
        }

        // Get the current sequence number and increment it
        const newSeqNumber = metaDataSnapshot.data().sequence + 1;
        
        // Update the sequence number in metadata
        transaction.update(metaDataRef, { sequence: newSeqNumber });
        
        return newSeqNumber;
    });

    // Add the current date to the data
    data.date = new Date();

    // Add the id field with the value of newDocID
    data.id = newDocID.toString();

    // Save the form data with the new ID
    const docRef = doc(db, "formSubmissions", newDocID.toString());
    await setDoc(docRef, data);
    console.log("Document written with ID: ", docRef.id);
}

async function handleFormSubmission(event) {
    event.preventDefault();

    let formData = {
        S0_propertyaddress: document.getElementById('propertyaddress').value,
        S0_tenantname: document.getElementById('tenantname').value,
        S0_inspectiondate: document.getElementById('inspectiondate').value,
        S0_inspectedby: document.getElementById('inspectedby').value,
        S1_facade_siding_condition: document.getElementById('01line01condition').value,
        S1_facade_siding_note: document.getElementById('01line01note').value,
        S1_roof_condition: document.getElementById('01line02condition').value,
        S1_roof_note: document.getElementById('01line02note').value,
        S1_parking_lot_condition: document.getElementById('01line03condition').value,
        S1_parking_lot_note: document.getElementById('01line03note').value,
        S1_landscaping_condition: document.getElementById('01line04condition').value,
        S1_landscaping_note: document.getElementById('01line04note').value,
        S1_lighting_condition: document.getElementById('01line05condition').value,
        S1_lighting_note: document.getElementById('01line05note').value,
        S1_signage_condition: document.getElementById('01line06condition').value,
        S1_signage_note: document.getElementById('01line06note').value,

        S2_walls_ceiling_condition: document.getElementById('02line01condition').value,
        S2_walls_ceiling_note: document.getElementById('02line01note').value,
        S2_flooring_condition: document.getElementById('02line02condition').value,
        S2_flooring_note: document.getElementById('02line02note').value,
        S2_lighting_condition: document.getElementById('02line03condition').value,
        S2_lighting_note: document.getElementById('02line03note').value,
        S2_windows_doors_condition: document.getElementById('02line04condition').value,
        S2_windows_doors_note: document.getElementById('02line04note').value,
        S2_restrooms_condition: document.getElementById('02line05condition').value,
        S2_restrooms_note: document.getElementById('02line05note').value,
        S2_stairwells_Elevators_condition: document.getElementById('02line06condition').value,
        S2_stairwells_Elevators_note: document.getElementById('02line06note').value
    };

    try {
        if (navigator.onLine) {
            await saveToFirebase(formData); // Use await here
            alert("Data Submitted Successfully!");  // Pop-up message for completion
        } else {
            let offlineForms = JSON.parse(localStorage.getItem('offlineForms')) || [];
            offlineForms.push(formData);
            localStorage.setItem('offlineForms', JSON.stringify(offlineForms));

            if ('serviceWorker' in navigator && 'SyncManager' in window) {
                navigator.serviceWorker.ready.then(function (registration) {
                    registration.sync.register('submitForms');
                });
            }
        }
        document.getElementById('myForm').reset();
    } catch (error) {
        alert("Error submitting data: " + error);
    }
}



function checkAndSyncOfflineData() {
    let storedForms = JSON.parse(localStorage.getItem('offlineForms'));
    if (storedForms && storedForms.length > 0) {
        storedForms.forEach(async (formData) => {
            await saveToFirebase(formData);
        });
        localStorage.removeItem('offlineForms');
    }
}


// Check if there's any stored data in local storage when back online
window.addEventListener('online', checkAndSyncOfflineData);

window.addEventListener('offline', function() {
    console.log("Device is offline");
});

// Register the Service Worker and check initial online/offline status
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(function () {
        console.log('Service Worker Registered');

        // Check initial status after registering the service worker
        if (navigator.onLine) {
            console.log("Device is online");
        } else {
            console.log("Device is offline");
        }
    });

    // Listen to messages from service worker for any data that needs to be synced
    navigator.serviceWorker.addEventListener('message', function (event) {
        const formData = event.data;
        if (formData) {
            saveToFirebase(formData);
        }
    });
}