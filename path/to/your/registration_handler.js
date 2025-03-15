const registerUser = async (req, res) => {
  // ... user creation code
  
  // Add this after user is created
  if (req.body.latitude && req.body.longitude) {
    await User.findByIdAndUpdate(newUser._id, {
      location: {
        type: "Point",
        coordinates: [req.body.longitude, req.body.latitude]
      }
    });
    console.log("Location saved for new user:", newUser._id);
  }
  
  // ... existing code
} 