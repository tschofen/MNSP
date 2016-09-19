Scrapes camping info
@author: Martin

Run app in dev with nodemon (must be installed) by prepending environment variables setup in .env (for Heroku)

`LOCALENV=true nodemon main.js`  
`LOCALENV=true SCHEDULED_PARKS="70|Split Rock Lighthouse,104|Tettegouche State Park" EMAIL_ADDRESS=blastomator@gmail.com nodemon main.js`

push to Heroku:
`git commit -a`  
`git push heroku master`