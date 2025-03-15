// When registering a new user, ensure you're capturing location
navigator.geolocation.getCurrentPosition(
  (position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    
    console.log("Captured location:", latitude, longitude);
    
    // Include these in your registration form data
    const userData = {
      // other user data
      latitude: latitude,
      longitude: longitude
    };
    
    // Send registration request with location data
  },
  (error) => {
    console.error("Error getting location:", error);
  }
); 