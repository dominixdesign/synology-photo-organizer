# synology-photo-organizer
nodejs script to sort photos on synology disc station in date based dirctories.

## prerequisites
  - ssh enabled | [Synology Knowledgebase](https://www.synology.com/knowledgebase/DSM/tutorial/General/How_to_login_to_DSM_with_root_permission_via_SSH_Telnet)
  - at least node 8 installed | [via Synology Package Center](https://www.synology.com/en-global/dsm/packages/Node_js_v8)
  - git installed | [via Synology Package Center](https://www.synology.com/de-de/dsm/packages/Git)

## installation

  1. clone this repository
  2. edit config.json and set all folder configs __(all folder needs to exists!)__
  
| config name        | description           |
| ------------- | ------------- |
| import      | all photos should be added to this folder, the script watches this folder for jpg images |
| error      | script moves all photos to the error folder after issues      |
| no-photos | script moves all non photo files to this folder. e.g. videos or texts     |
| output | all year folders were created in this folder, and so all photos end up in this folder |
  3. add the script to the Task scheduler:
     1. open control panel -> Task Scheduler
     2. Create -> Triggered Task -> User-defined script
     3. General Tab, User: `root`, Event: `Boot-up`
     4. Task Settings Tab, Run command: `node path/to/cloned/repository/index.js`
     5. restart system or right click -> "run" on new created task
     
 after that, every photo added to your `import` folder will be checked for a creation date (exif, file information, etc) and sorted after that date.
 e.g. `folder/2018/2018-05-12` for a photo from the 12th of may in 2018.
