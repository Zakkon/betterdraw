# BetterDraw

**A drawing module for Foundry VTT**

Ever felt like Foundry's default drawing functionality just isn't good enough? Don't worry, you're not the only one.
**BetterDraw** is a simple module for those GM's who like to draw maps as they're playing.
It is specifically developed 

## Features

* A pixel-based layer that can be drawn upon in real-time by the GM
* Automatic syncronization to other clients, letting players see you draw in real-time
* A brush/pencil tool for freehand drawing
* A grid tool that treats each grid space as a pixel (square grids only)
* A Rectangle tool for painting large rectangular areas
* An RGB color picker
* A color palette for quick selection of colors
* A customizable brush size setting
* Undo (Ctrl + Z) functionality
* Your drawing is saved as an image file, which you could edit in an image editing program, before re-importing it into Foundry.

## Why BetterDraw?

Foundry does come equipped with a set of drawing tools, but these tools can only draw vector graphics (such as polygons, curved lines, and other basic shapes). This functionality is no doubt enough for most usecases, but I find it lacking.
This module is specifically developed with the goal of letting GM's quickly draw very simple grid-based battlemaps at low resolution.

For example, whenever you and your players find yourselves in a combat encounter you didn't prep for, you no longer have to scour the internet for a battlemap that fits your situation.
Instead, you can using this module draw a quick battlemap, for example coloring impassable grids as black, and others white.
You obviously won't get the same level of detail as a high-res battlemap, but then again, you only had to spend seconds drawing.
Just be sure to explain to your players what the shapes you just drew are meant to represent!

If you don't happen to find BetterDraw's drawing tools good enough, don't worry! You can use any image editing software program you'd like, without much additional effort.
Whenever you save a drawn layer (CTRL + S), that drawing is saved as an image in your Foundry gamedata (the file name will be the ID of the scene).
You can simply open up that file in an image editing software (like Paint.net), draw your changes, save, and when you refresh the scene in Foundry, those changes will be shown in your scene.

## Controls

* Undo: CTRL + Z
* Save Layer: CTRL + S

## Compatibility

BetterDraw is known to work fine with SimpleFog (a fog of war module).

## Known Issues & Limitations

* Since Foundry doesn't support grid sizes under 50px in size, BetterDraw has to go through some hoops by resizing the scene dimensions to get around that issue.
* Foundry periodically deletes objects and textures needed by this module. However, these objects are replaced during runtime and should not create any noticable issues for users.
* No current support for non-square grids (such as hexes). Freehand drawing will still work, however.
* Currently only supports one drawing layer per scene.