#!/bin/bash
# gitinit.sh

read -p "Nom du repertoire git, sans suffixe: " "dirname"
git init
git remote add origin https://github.com/AJB1000/$dirname.git
git add .
git commit -m "Déploiement initial"
git push -u origin master