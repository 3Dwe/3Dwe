---
title: 3Dwe
description: Integrative 3D File Storage Application
author: Aibek Sarbayev, Peng Gao, Sean Noran, Wei Lin, Swetal Bhatt
tags: 3D, webGL, threejs, webRTC, file storage

---

Master
======

## Description

3Dwe is an integrative file storage application running on webGL 3D. The user is immersed in a room containing various
media interfaces such as a television set for viewing videos and recording web video, a photo album for viewing picture
files, a book for reading pdfs and a jukebox for listening to music.

## Setup

If the program does not run initially, carefully follow these instructions:
    1. Make sure your web browser is compatible with our application. It is currently supported by Chrome and Firefox.
       If you are using either of those web browsers and the application does not run, consider updating to your browser's
       latest version. The application should run on mobile devices; however, the layout is not intended to be consistent
       with most mobile phone screen sizes and resolutions. If you are using Internet Explorer, please reconsider for the
       sake of humanity.
    2. Make sure pgAdmin is installed on your local machine. If you are unable to register a user with 3Dwe, copy the SQL
       queries in /db/db.sql and execute them in pgAdmin. This will create the empty database table required for login.
       In future versions, the database will be stored on a persistent server and the application will be running in http.

## Login

If you are not currently registered for 3Dwe, click on the icon in the top-right, then click SignUp. You should be
redirected to the registration page. Enter a valid email address, name and a password. Note that passwords are NOT
currently encrypted. They are stored as plaintext on a local database.

## Explorer Panel

Remember that button you pressed to register? Click it now and you will see a preliminary file explorer view, which will
display folders and files you uploaded. There are 4 main folders in your home directory:
    1. Music : .mp3
    2. PDFs : .pdf | .txt
    3. Photos : .jpg | .png
    4. Videos : .mp4 | .wmv | .MOV | .webm
However, feel free to create new directories to personalize your file system.

To upload files, simply click on the upload button. Most unsupported media file types can be uploaded. For example, the
user can upload a .gif file but it will not be displayed in the photo album or in the TV.

## Jukebox

Enjoy your favorite songs from a life-like 3D jukebox! Simply add them to the /Home/Music directory.

## TV

To play videos, click on a supported video file in the explorer panel. To record a video, click the record button on the
television set. Note that the buttons are only visible when you hover over the bottom of the screen.

## Photo Album

The photo album displays photos contained in the /Home/Photos directory.

## Book

Press N to view the book. Because the pdf embedding library is inefficient, the book is currently not displayed by
default. We are in the process of integrating .pdf and .txt files more effectively.

## Frequently Asked Questions

Ask away!

## Screenshots

Click to view.

![Room](/assets/screenshots/room.png)
![Room2](/assets/screenshots/room2.png)
![Jukebox](/assets/screenshots/Jukebox.png)
![Mirror](/assets/screenshots/Mirror.png)
![Photo Album](/assets/screenshots/photo_album.png)
![TV](/assets/screenshots/TV.png)
![Black White](/assets/screenshots/black_white.png)
![Blooper](/assets/screenshots/blooper.png)

## Changelog

--

## File Explorer Demo

Visit http://ec2-54-234-58-212.compute-1.amazonaws.com/ for a demo of our other related project!