var APP_DATA = {
  "scenes": [
    {
      "id": "room1",
      "name": "room1",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 1536,
      "initialViewParameters": {
        "yaw": 2.507082116005206,
        "pitch": 0.002544261007862758,
        "fov": 1.2599180821480807
      },
      "linkHotspots": [
        {
          "yaw": 2.507082116005206,
          "pitch": 0.002544261007862758,
          "rotation": 0.7853981633974483,
          "target": "room2"
        }
      ],
      "infoHotspots": [],
      "audio": "auido/welcome_message.wav"
    },
    {
      "id": "room2",
      "name": "room2",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        }
      ],
      "faceSize": 360,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [],
      "infoHotspots": [],
      "audio": "auido/Palmera_Function_Room.wav"
    }
  ],
  "name": "Project Title",
  "settings": {
    "mouseViewMode": "drag",
    "autorotateEnabled": true,
    "fullscreenButton": false,
    "viewControlButtons": false
  }
};
