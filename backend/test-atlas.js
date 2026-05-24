const mongoose = require('mongoose');

const uri = 'mongodb+srv://jhahimanshu653:Himanshu2004%40@cluster0.7snkkwu.mongodb.net/vedaai?retryWrites=true&w=majority&appName=Cluster0';

console.log('Connecting to MongoDB Atlas...');
mongoose.connect(uri)
  .then(() => {
    console.log('SUCCESS: Connected to MongoDB Atlas successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('ERROR: Failed to connect to MongoDB Atlas:', err.message);
    process.exit(1);
  });
