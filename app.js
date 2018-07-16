// Import dsteem and firebase clients
const dsteem = require('dsteem');
const firebase = require('firebase');

// Get these Firebase settings from your Firebase project settings and past them in here
const config = {
    apiKey: "AIzaSyA0ZlY2kjeHPB0Dvjv0ZE7YlR1017l6p48",
    authDomain: "test-app-8589c.firebaseapp.com",
    databaseURL: "https://test-app-8589c.firebaseio.com",
    projectId: "test-app-8589c",
    storageBucket: "test-app-8589c.appspot.com",
    messagingSenderId: "227722317101"
};

// Initialise the Firebase project
firebase.initializeApp(config);

// Create a Firestore reference
const db = firebase.firestore();

// Required for snapshot timestamps or Firebase throws a warning in the console
const settings = { timestampsInSnapshots: true };

// Configure Firestore with our settings
db.settings(settings);

// Connect to the official Steemit API
const client = new dsteem.Client('https://api.steemit.com');

// Start streaming blocks
const stream = client.blockchain.getOperationsStream();

// Watch the "data" event for operations taking place on Steem
// This gets updated approximately every 3 seconds
stream.on('data', operation => {
    // Get the block operation
    const OPERATION_TYPE = operation.op[0];

    // The types of operations we want to store, in this case posts are operation type "comment"
    const ALLOWED_OPERATION_TYPES = ['comment'];

    // If the streamed operation is in the allowed operation types array
    if (ALLOWED_OPERATION_TYPES.includes(OPERATION_TYPE)) {
        // Get the object representation of the operation (it's content including json meta)
        const OPERATION_OBJECT = operation.op[1];

        // Is this a user post or is it a comment on a post? Posts do not have a parent author, comments do
        const CONTENT_TYPE = OPERATION_OBJECT.parent_author === '' ? 'post' : 'comment';

        // Convert json_metadata into a real JSON object to be stored
        if (OPERATION_OBJECT.json_metadata) {
            OPERATION_OBJECT.json_metadata = JSON.parse(OPERATION_OBJECT.json_metadata);
        }

        // If this operation is a post
        if (CONTENT_TYPE === 'post') {
            db.collection('posts').add(OPERATION_OBJECT);
            // This operation is a comment
        } else if (CONTENT_TYPE === 'comment') {
            db.collection('comments').add(OPERATION_OBJECT);
        }
    }
});