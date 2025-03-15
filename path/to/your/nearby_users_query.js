const nearbyUsers = await User.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [longitude, latitude]
      },
      $maxDistance: maxDistance
    }
  }
}); 