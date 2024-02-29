const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'))
app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
  // Configure your email provider here
  service: 'gmail',
  auth: {
    user: 'Visheshj865@gmail.com',
    pass: 'vqiv tdib gapv ihyc',
  },
});




const URL = "mongodb+srv://visheshj865:Vishesh6609@cluster0.bw0bufi.mongodb.net/filmy-kart?retryWrites=true&w=majority";

mongoose.connect(URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, require: true },
  path: { type: String, require: true },
});



const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  qty: Number,
  sizes: [String],
  // thumbnail: String, 
  images: [String], // Assuming images are stored as Buffers
  status: String,
  category: String,

});



const bannerSchema = new mongoose.Schema({
  bannerName: String,
  bannerImage: String,
  bannerStatus: String,
});

const userSchema = new mongoose.Schema({
  userfullname: String,
  useremailid: String,
  userpassword: String,
});


const User = mongoose.model('User', userSchema);

const Banner = mongoose.model('Banner', bannerSchema);

const Product = mongoose.model('Product', productSchema);

const Category = mongoose.model('Category', categorySchema);

const storage = multer.diskStorage({
  destination: 'public/Images',
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post('/api/categories', upload.single('image'), async (req, res) => {
  try {

    const { name } = req.body;
    const image = req.file ? req.file.filename : null;
    const imagePath = image;

    const category = new Category({ name, image, imagePath });
    await category.save();

    res.json({ message: 'Category saved successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


app.get('/api/getcategories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// app.post('/api/upload', upload.array('images', 5), async (req, res) => {
//   try {
//     const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
//     res.json({ fileUrls });
//   } catch (error) {
//     console.error('Error uploading images:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

app.post('/api/products', upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, qty, sizes, status, category } = req.body;
    const images = req.files.map(file => file.filename);
    

    const newProduct = new Product({
      name,
      description,
      price,
      qty,
      sizes: sizes.split(','),
      status,
      images,
      category,
    });

    await newProduct.save();

    res.status(201).json({ message: 'Product added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/products/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/uploadbanner', upload.single('bannerImage'), async (req, res) => {
  const { bannerName, bannerStatus } = req.body;
  const bannerImage = req.file.filename; // Multer adds a "file" property to the request
  // console.log(bannerName)
  try {
    const newBanner = new Banner({ bannerName, bannerImage, bannerStatus });
    await newBanner.save();
    res.json({ message: 'Banner uploaded successfully' });
  } catch (error) {
    res.status(500).send(error.message);
  }
});


app.get('/api/getuploadbanner', async (req, res) => {
  try {
    const activeImages = await Banner.find({ bannerStatus: 'active' });
    console.log(activeImages)
    res.json(activeImages);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


app.delete('/api/categories/:categoryId', async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    // Use Mongoose to find and delete the category by ID
    const deletedCategory = await Category.findByIdAndDelete(categoryId);

    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.put('/api/categories/:categoryId', async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const { name } = req.body;

    // You may want to update the image only if a new image is provided
    const updateFields = {};
    if (req.file) {
      updateFields.image = req.file.filename;
    }

    if (name) {
      updateFields.name = name;
    }

    // Use Mongoose to find and update the category by ID
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.status(200).json({ message: 'Category updated successfully', updatedCategory });
  } catch (error) {
    console.error('Error updating category', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/api/register', async (req, res) => {
  const { userfullname, useremailid, userpassword } = req.body;
  try {
    const existingUser = await User.findOne({ useremailid: req.body.useremailid });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(userpassword, 10);

    // Save the user to the database
    const user = new User({
      userfullname,
      useremailid,
      userpassword: hashedPassword,
    });

    await user.save();

    
      const mailOptions = {
        from: 'Visheshj865@gmail.com',
        to: useremailid,
        subject: 'Account Created',
        text: 'Your account has been successfully created. Welcome!',
      };
    
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          res.status(500).json({ message: 'Error sending account creation email' });
        } else {
          console.log('Email sent:', info.response);
          res.status(201).json({ message: 'User registered successfully' });
        }
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
