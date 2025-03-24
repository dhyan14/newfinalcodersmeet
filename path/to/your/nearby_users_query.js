// Add before the query
console.log("Searching for users near coordinates:", longitude, latitude, "with max distance:", maxDistance);

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

// Add after the query
console.log("Found nearby users count:", nearbyUsers.length);
console.log("Nearby users IDs:", nearbyUsers.map(user => user._id)); 