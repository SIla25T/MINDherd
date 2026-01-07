# MINDHerd - Dynamiques sociales équines

![Miniature du jeu](./assets/miniature.png)

# Description

Dans MINDHerd, vous incarnez un cheval au sein d’un troupeau sauvage, évoluant dans un monde où chaque action chaque choix, influence la cohésion, la survie et l’équilibre du troupeau. Vous serez confronté·e à des dilemmes: fuir ou protéger ? Suivre ou guider ? Isoler ou rassembler ? Chacun de vos choix façonnera le destin du troupeau… et vous enseignera les dynamiques 
sociales équines. 

**Vos objectifs :**

* Survivre aux aléas de la nature (tempêtes, sécheresses, prédateurs).
* Maintenir l'unité du groupe face aux tensions internes.
* Comprendre les mécanismes subtils de la hiérarchie et de la coopération animale.

> *« Fuir ou protéger ? Suivre ou guider ? Isoler ou rassembler ? Chacun de vos choix façonnera le destin du troupeau. »*

## Mecaniques de jeu 
Le jeu s'articule autour de la gestion de quatre statistiques vitales. Si l'une d'elles tombe à **zéro**, le troupeau se disperse et la partie est perdue (Game Over).

 **Autorité :** La capacité à imposer des décisions cruciales en situation de crise. Une autorité trop faible mène au chaos, trop forte à la tyrannie.
 **Confiance :** Le sentiment de sécurité des individus. Sans confiance, le stress augmente et les réactions deviennent imprévisibles.
 **Cohésion :** La force du lien social. C'est ce qui empêche le groupe d'éclater lors des migrations ou des attaques.
 **Hiérarchie :** Le respect de l'ordre social établi, essentiel pour éviter les conflits internes permanents.


### Profils de Chevaux
Le joueur peut choisir son avatar, influençant le style de jeu :
* **Le cheval Noir (Moteur) :** Un leader naturel, fort en déplacement, mais parfois autoritaire.
* **Le cheval Bai (Sensible) :** Le liant social, attentif aux émotions et aux tensions, idéal pour la cohésion.
* **Le cheval gris (Observateur) :** Vigilant et en retrait, il excelle dans la détection des dangers et l'anticipation.

> *Note : Les couleurs de robe sont utilisées ici comme des archétypes visuels propres à l'espèce équine. Elles ne suggèrent aucune hiérarchie de valeur, aucune connotation négative, ni aucune analogie avec les dynamiques sociales humaines.*


# Installation et lancement

1. Clonez ce dépôt :
```bash
git 
```

## Dépendances et technologies utilisées

### Cœur du projet
* **[Kaplay.js](https://kaplayjs.com/) (v3001) :** Une bibliothèque JavaScript performante et intuitive pour la création de jeux 2D. Elle gère ici le rendu graphique, la physique des sprites, la gestion des scènes et le système audio.
* **HTML5 / CSS :** Pour la structure et le style de la page hôte.
* **JavaScript :** Logique complète du jeu, gestion des états, algorithmes de mélange (Fisher-Yates) et manipulation du DOM.

### Outils de développement
* **Visual Studio Code :** Environnement de développement intégré (IDE).
* **Git & GitHub :** Gestion de version et hébergement du code source.
* **IA (ChatGPT, Gemini) :** Utilisé comme pair-programmer pour le débogage complexe, l'optimisation des algorithmes de tri aléatoire pour une meilleure fiabilité. 

## 📚 Sources et Crédits

Ce projet respecte les droits d'auteur et s'appuie sur une littérature scientifique rigoureuse.

### Documentation Éthologique
Les mécaniques de jeu sont basées sur les travaux suivants :

*  **Bourjade, M. (2007).** *Sociogenèse et expression des comportements individuels et collectifs chez le cheval.* Thèse de doctorat, Université Louis Pasteur.

Cette thèse démontre que le "chef" du troupeau n'est pas celui qui décide de tout. Elle a servi à modéliser les systèmes de déplacement et de prise de décision collective, justifiant pourquoi le leadership (suivre un initiateur) est parfois distinct de la hiérarchie pure (dominance/ autorité). En d'autres termes, elle démontre que les décisions de déplacement dans un troupeau sont souvent collectives et partagées. Le leadership n'est pas forcément lié à la dominance agressive, mais à la capacité d'entraîner les autres (affiliation).

*  **Jorgensen, G.H.M., et al. (2009).** *Grouping horses according to gender - Effects on aggression, spacing and injuries.* Applied Animal Behaviour Science. 

Cette étude sur la stabilité sociale a permis de calibrer les jauges de Cohésion et de Hiérarchie. Elle explique les conséquences (stress, agressivité, blessures) lorsqu'un nouveau membre arrive ou lorsque l'espace vital est menacé, rendant les situations de conflit du jeu réalistes.


### Assets Graphiques et Sonores
* **Musique et SFX :**
    * Sons d'ambiance et bruitages (hennissements, orages, loups) provenant de [Freesound.org](https://freesound.org/) et [Pixabay.com](https://pixabay.com/) (Licences libres de droits).
* **Graphismes :**
    * Sprites des chevaux et arrière-plans adaptés depuis [OpenGameArt.org](https://opengameart.org/) et [Pngkit.com](https://www.pngkit.com/).

## Contexte de développement
En mettant le joueur en situation de stress ou de conflit, le jeu permet de comprendre que les décisions d'un animal ne sont pas aléatoires, mais dictées par des impératifs de survie et de structure sociale. Le développement a nécessité une recherche documentaire approfondie pour garantir que les conséquences des choix dans le jeu reflètent, de manière simplifiée mais juste, la réalité biologique.

Ce projet a été développé dans le cadre du cours Jeu vidéo 2D dispensé par Isaac Pante (SLI, Lettres, UNIL).