// Initialisation de Kaplay
kaplay({
    background: [135, 206, 235],
    width: 1280,
    height: 720,
    scale: 1,
    debug: true
});

// Charger les assets 
loadSprite("white_horse", "assets/white_horse.png");
loadSprite("brown_horse", "assets/brown_horse.png");
loadSprite("black_horse", "assets/black_horse.png");
loadSprite("background", "assets/background.png");

// Charger les sons 
const sounds = {
    click: "assets/sounds/click.mp3",
    hover: "assets/sounds/hover.mp3",
    background_music: "assets/sounds/background_music.mp3",
    horse_neigh: "assets/sounds/horse_neigh.mp3",
    wolf_howl: "assets/sounds/wolf_howl.mp3",
    thunder: "assets/sounds/thunder.mp3",
};

// Fonction pour charger les sons avec gestion des erreurs
function loadGameSounds() {
    Object.entries(sounds).forEach(([name, path]) => {
        try {
            loadSound(name, path);
        } catch (error) {
            console.warn(`Impossible de charger le son ${name}: ${error.message}`);
        }
    });
}

loadGameSounds();

//  Variables globales pour l'état du jeu

let gameState = {
    herd: [],
    player: null,
    stats: {
        Autorité: 100,
        confiance: 100,
        cohesion: 100,   
        hierarchie: 100    
    },
    currentBox: null,  
    boxChoices: [],      
    usedBoxes: new Set(), 
    selectedHorse: null,
    musicPlaying: false,
    availableSituations: [],
    soundEnabled: true
};

// Variable globale pour suivre les situations utilisées
let globalUsedSituations = new Set();

// Fonction pour jouer un son 
function playGameSound(name, options = {}) {
    if (!gameState.soundEnabled) return;
    
    try {
        // Arrêter la musique de fond si on joue un autre son
        if (name !== "background_music" && gameState.musicPlaying) {
            try {
                stop("background_music");
                gameState.musicPlaying = false;
            } catch (error) {
                console.warn("Impossible d'arrêter la musique de fond:", error.message);
            }
        }
        
        play(name, {
            volume: options.volume || 0.5,
            loop: options.loop || false
        });
    } catch (error) {
        console.warn(`Impossible de jouer le son ${name}: ${error.message}`);
    }
}

// Définition des situations de base
const baseSituations = [
    // Situations de conflit 
    {
        id: "conflict_food",
        title: "Conflit pour la nourriture",
        description: "Deux chevaux se disputent pour l'accès à la nourriture.",
        scientificInfo: "Savais-tu que les chevaux affirment leur autorité par des signaux corporels, comme les oreilles couchées et la dilatation des naseaux, lors de conflits pour les ressources ?",
        choices: [
            {
                text: "Intervenir avec autorité",
                effects: {
                    black_horse: { Autorité: -20, confiance: -10, hierarchie: -25, cohesion: -15 },
                    brown_horse: { Autorité: -10, confiance: -15, hierarchie: -20, cohesion: -20 },
                    white_horse: { Autorité: -15, confiance: -15, hierarchie:- 20, cohesion: -15 }
                }
            },
            {
                text: "Laisser les chevaux se débrouiller",
                effects: {
                    black_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 }
                }
            }
        ]
    },
    {
        id: "conflict_territory",
        title: "Conflit territorial",
        description: "Un autre troupeau s'approche de votre territoire.",
        scientificInfo: "Le savais-tu ? L’étalon et les juments meneuses assurent la protection du groupe. L’étendue de leur zone de vie dépend directement de l’accès aux ressources locales disponibles.",
        choices: [
            {
                text: "Défendre le territoire",
                effects: {
                    black_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 }
                }
            },
            {
                text: "Rechercher un compromis",
                effects: {
                    black_horse: { Autorité: -20, confiance: -25, hierarchie: -5, cohesion: -20 },
                    brown_horse: { Autorité: -15, confiance: -20, hierarchie: -5, cohesion: -15 },
                    white_horse: { Autorité: -15, confiance: -15, hierarchie: -5, cohesion: -15 }
                }
            }
        ]
    },
    {
        id: "conflict_hierarchy",
        title: "Conflit de hiérarchie",
        description: "Un jeune étalon remet en question l'autorité du chef du troupeau.",
        scientificInfo: "Le savais-tu ? Les duels entre étalons sont observés de loin par le troupeau. Ces tensions de hiérarchie sont particulièrement fréquentes pendant la saison des amours. ",
        choices: [
            {
                text: "Soutenir le chef actuel",
                effects: {
                    black_horse: { Autorité: -15, confiance: -5, hierarchie: -15, cohesion: -15 },
                    brown_horse: { Autorité: -10, confiance: -5, hierarchie: -15, cohesion: -15 },
                    white_horse: { Autorité: -10, confiance: -5, hierarchie: -15, cohesion: -15 }
                }
            },
            {
                text: "Laisser la nature suivre son cours",
                effects: {
                    black_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 }
                }
            }
        ]
    },
    // Situations de danger 
    {
        id: "danger_predator",
        title: "Prédateur à l'horizon",
        description: "Un loup a été repéré dans les environs.",
        scientificInfo: "Le savais-tu ? Le cheval possède une vision de 350°, ne laissant que deux petits angles morts. C’est l’outil ultime de cette proie pour détecter les menaces et fuir rapidement.",
        choices: [
            {
                text: "Fuir immédiatement",
                effects: {
                    black_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0},
                    brown_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 }
                }
            },
            {
                text: "Rester calme et observer",
                effects: {
                    black_horse: { Autorité: -20, confiance: -20, hierarchie: -15, cohesion: -20 },
                    brown_horse: { Autorité: -15, confiance: -20, hierarchie: -10, cohesion: -20 },
                    white_horse: { Autorité: -15, confiance: -20, hierarchie: -10, cohesion: -20 }
                }
            }
        ]
    },
    {
        id: "danger_storm",
        title: "Tempête approche",
        description: "Une tempête se dirige vers le troupeau.",
        scientificInfo: "Le savais-tu ? Les chevaux pressentent les tempêtes. Leur sensibilité aux variations de pression et d'humidité leur permet de réagir bien avant que nous n'apercevions le moindre nuage.",
        choices: [
            {
                text: "Chercher un abri immédiatement",
                effects: {
                    black_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 }
                }
            },
            {
                text: "Attendre pour voir l'évolution",
                effects: {
                    black_horse: { Autorité: -15, confiance: -10, hierarchie: -10, cohesion: -20 },
                    brown_horse: { Autorité: -15, confiance: -15, hierarchie: -5, cohesion: -15 },
                    white_horse: { Autorité: -10, confiance: -20, hierarchie: 0, cohesion: -15 }
                }
            }
        ]
    },
    {
        id: "danger_fire",
        title: "Feu de prairie",
        description: "Un feu se propage dans la direction du troupeau.",
        scientificInfo: " Le savais-tu? Face à une menace comme un incendie, les chevaux sauvages renforcent leur cohésion. Ils fuient en groupe serré, plaçant les juments et les poulains au centre pour mieux les protéger.",
        choices: [
            {
                text: "Fuir dans la direction opposée",
                effects: {
                    black_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 }
                }
            },
            {
                text: "Chercher un point d'eau",
                effects: {
                    black_horse: { Autorité: -10, confiance: -10, hierarchie: -10, cohesion: -10 },
                    brown_horse: { Autorité: -10, confiance: -15, hierarchie: -5, cohesion: -15 },
                    white_horse: { Autorité: -10, confiance: -10, hierarchie: -5, cohesion: -10 }
                }
            }
        ]
    },
    // Situations sociales 
    {
        id: "social_new_member",
        title: "Nouveau membre",
        description: "Un cheval solitaire approche du troupeau.",
        scientificInfo: "Le savais-tu ? Pour un cheval, le groupe c'est la vie ! Rejoindre un troupeau est crucial pour se protéger des prédateurs et garantir son accès à l’eau et à la nourriture. suivant le sexe et l’âge du cheval solitaire, son intégration peut être plus ou moins conflictuelle.",
        choices: [
            {
                text: "Accueillir chaleureusement",
                effects: {
                    black_horse: { Autorité: -15, confiance: -15, hierarchie: -15, cohesion: -10 },
                    brown_horse: { Autorité: -10, confiance: -10, hierarchie: -15, cohesion: -10 },
                    white_horse: { Autorité: -10, confiance: -10, hierarchie: -15, cohesion: -10 }
                }
            },
            {
                text: "Maintenir une distance",
                effects: {
                    black_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 }
                }
            }
        ]
    },
    {
        id: "social_mating",
        title: "Saison des amours",
        description: "La saison des amours approche, créant des tensions dans le troupeau.",
        scientificInfo: "Le savais-tu ? Les juments sont en chaleur pendant 4-6 jours tous les 21 jours. Durant la saison des amours, la compétition entre mâles est un processus naturel vital qui assure la force et la santé des futures générations.",
        choices: [
            {
                text: "Laisser les étalons régler la hiérarchie naturellement",
                effects: {
                    black_horse: { Autorité: 5, confiance: 0, hierarchie: -5, cohesion: -5 },
                    brown_horse: { Autorité: 5, confiance: 0, hierarchie: -5, cohesion: -5 },
                    white_horse: { Autorité: 5, confiance: 0, hierarchie: -5, cohesion: -5 }
                }
            },
            {
                text: "Maintenir l'ordre",
                effects: {
                    black_horse: { Autorité: -20, confiance: -5, hierarchie: -20, cohesion: -10 },
                    brown_horse: { Autorité: -10, confiance: -5, hierarchie: -10, cohesion: -15 },
                    white_horse: { Autorité: -5, confiance: -5, hierarchie: -5, cohesion: -20 }
                }
            }
        ]
    },
    {
        id: "social_foal",
        title: "Naissance d'un poulain",
        description: "Une jument du troupeau vient de mettre bas.",
        scientificInfo: "Le savais-tu ? Un poulain marche dès sa première heure de vie. Cette précocité est vitale pour suivre le troupeau et fuir les prédateurs sans attendre.",
        choices: [
            {
                text: "Protéger la mère et le poulain",
                effects: {
                    black_horse: { Autorité: 0, confiance: 5, hierarchie: 0, cohesion: 10 },
                    brown_horse: { Autorité: 0, confiance: 10, hierarchie: 0, cohesion: 15 },
                    white_horse: { Autorité: 0, confiance: 10, hierarchie: 0, cohesion: 10 }
                }
            },
            {
                text: "Continuer normalement",
                effects: {
                    black_horse: { Autorité: -20, confiance: -10, hierarchie: -20, cohesion: -10 },
                    brown_horse: { Autorité: -15, confiance: -5, hierarchie: -15, cohesion: -5 },
                    white_horse: { Autorité: -10, confiance: -10, hierarchie: -10, cohesion: 0 }
                }
            }
        ]
    },
    // Situations de ressources 
    {
        id: "resource_food",
        title: "Pénurie de nourriture",
        description: "Les ressources sont limitées et certains chevaux n'ont pas assez à manger.",
        scientificInfo: "Le savais-tu ? Chez les chevaux, l'accès aux ressources est un privilège de rang. En cas de manque, les dominants s'imposent pour garantir leur propre survie.",
        choices: [
            {
                text: "Partager équitablement",
                effects: {
                    black_horse: { Autorité: -15, confiance: -5, hierarchie: -20, cohesion: -20 },
                    brown_horse: { Autorité: -10, confiance: -5, hierarchie: -15, cohesion: -20 },
                    white_horse: { Autorité: -10, confiance: -5, hierarchie: -15, cohesion: -20 }
                }
            },
            {
                text: "Laisser la hiérarchie décider",
                effects: {
                    black_horse: { Autorité: 15, confiance: -5, hierarchie: 10, cohesion: 0 },
                    brown_horse: { Autorité: 10, confiance: -5, hierarchie: 10, cohesion: 0 },
                    white_horse: { Autorité: 10, confiance: -5, hierarchie: 10, cohesion: 0 }
                }
            }
        ]
    },
    {
        id: "resource_water",
        title: "Point d'eau limité",
        description: "Le seul point d'eau disponible est presque à sec.",
        scientificInfo: "Le savais-tu ? Un cheval peut boire jusqu’à 50 litres d'eau par jour. Si la survie sans boire est possible durant 48 à 72 heures, la déshydratation devient vite fatale, faisant de l’eau la priorité vitale du troupeau.",
        choices: [
            {
                text: "Limiter l'accès",
                effects: {
                    black_horse: { Autorité: -10, confiance: -15, hierarchie: -5, cohesion: -20 },
                    brown_horse: { Autorité: -10, confiance: -15, hierarchie: -5, cohesion: -20 },
                    white_horse: { Autorité: -10, confiance: -15, hierarchie: -5, cohesion: -20 }
                }
            },
            {
                text: "Chercher une autre source",
                effects: {
                    black_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 }
                }
            }
        ]
    },
    {
        id: "resource_shelter",
        title: "Abri limité",
        description: "Une tempête approche mais l'abri ne peut accueillir qu'une partie du troupeau.",
        scientificInfo: "Le savais-tu ? les chevaux résistent de -40°C à +40°C. En tempête, ils font bloc dos au vent, même si l’accès aux meilleurs abris reste dicté par la hiérarchie.",
        choices: [
            {
                text: "Protéger les plus vulnérables",
                effects: {
                    black_horse: { Autorité: -15, confiance: -10, hierarchie: -15, cohesion: -10 },
                    brown_horse: { Autorité: -10, confiance: -5, hierarchie: -10, cohesion: -10 },
                    white_horse: { Autorité: -10, confiance: -5, hierarchie: -10, cohesion: -10 }
                }
            },
            {
                text: "Respecter la hiérarchie",
                effects: {
                    black_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 }
                }
            }
        ]
    },
    // Situations de santé 
    {
        id: "health_sick",
        title: "Membre malade",
        description: "Un membre du troupeau est tombé malade et ralentit le groupe.",
        scientificInfo: "Le savais-tu ? En nature, un cheval malade s'isole du troupeau. Ce comportement vital protège le groupe des épidémies et évite de signaler une vulnérabilité aux prédateurs.",
        choices: [
            {
                text: "Ralentir pour le soigner",
                effects: {
                    black_horse: { Autorité: -15, confiance: -10, hierarchie: -10, cohesion: -10 },
                    brown_horse: { Autorité: -10, confiance: -10, hierarchie: -5, cohesion: -10 },
                    white_horse: { Autorité: -10, confiance: -10, hierarchie: -5, cohesion: -10 }
                }
            },
            {
                text: "Continuer sans lui",
                effects: {
                    black_horse: { Autorité: 0, confiance: -5, hierarchie: 0, cohesion: -5 },
                    brown_horse: { Autorité: 0, confiance: -5, hierarchie: 0, cohesion: -5 },
                    white_horse: { Autorité: 0, confiance: -5, hierarchie: 0, cohesion: -5 }
                }
            }
        ]
    },
    {
        id: "health_injury",
        title: "Blessure grave",
        description: "Un cheval s'est gravement blessé à la jambe.",
        scientificInfo: "Le savais-tu ? Un cheval incapable de fuir devient une cible pour les prédateurs. Pour la survie du groupe, l'individu blessé est souvent abandonné : un sacrifice instinctif pour ne pas ralentir le troupeau.",
        choices: [
            {
                text: "Attendre qu'il guérisse",
                effects: {
                    black_horse: { Autorité: -20, confiance: -20, hierarchie: -10, cohesion: -10 },
                    brown_horse: { Autorité: -15, confiance: -20, hierarchie: -10, cohesion: -15 },
                    white_horse: { Autorité: -10, confiance: -20, hierarchie: -10, cohesion: -10 }
                }
            },
            {
                text: "le laisser seul",
                effects: {
                    black_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                }
            }
        ]
    },
    {
        id: "health_aging",
        title: "Vieillissement",
        description: "Les membres les plus âgés du troupeau commencent à ralentir.",
        scientificInfo: "Le savais-tu ? Les chevaux sauvages vivent en moyenne 10 ans, contre 25-30 ans en captivité, ce qui rend le vieillissement un facteur critique pour leur survie en milieu naturel.",
        choices: [
            {
                text: "Adapter le rythme",
                effects: {
                    black_horse: { Autorité: -10, confiance: 0, hierarchie: -5, cohesion: -5 },
                    brown_horse: { Autorité: -10, confiance: 0, hierarchie: -5, cohesion: -5 },
                    white_horse: { Autorité: -10, confiance: 0, hierarchie: -5, cohesion: -5 }
                }
            },
            {
                text: "Maintenir le rythme",
                effects: {
                    black_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { Autorité: 0, confiance: -5, hierarchie: 0, cohesion: 0 },
                    white_horse: { Autorité: 0, confiance: -5, hierarchie: 0, cohesion: 0 }
                }
            }
        ]
    },
    // Situations environnementales 
    {
        id: "env_migration",
        title: "Migration nécessaire",
        description: "Les ressources locales s'épuisent, il faut migrer.",
        scientificInfo: "Le savais-tu ? Un cheval sauvage peut parcourir jusqu'à 30 km par jour. Cette endurance est vitale pour migrer vers de nouveaux pâturages lorsque les ressources locales s'épuisent.",
        choices: [
            {
                text: "Partir immédiatement",
                effects: {
                    black_horse: { Autorité: 20, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { Autorité: 10, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { Autorité: 5, confiance: 0, hierarchie: 0, cohesion: 0 }
                }
            },
            {
                text: "Attendre le printemps",
                effects: {
                    black_horse: { Autorité: -15, confiance: -15, hierarchie: -5, cohesion: -15 },
                    brown_horse: { Autorité: -10, confiance: -15, hierarchie: -5, cohesion: -10 },
                    white_horse: { Autorité: -10, confiance: -15, hierarchie: -5, cohesion: -10 }
                }
            }
        ]
    },
    {
        id: "env_flood",
        title: "Inondation",
        description: "Une inondation menace de couper l'accès aux ressources.",
        scientificInfo: "Le savais-tu ? Ils sont capables de nager sur de grandes distances. Une compétence de survie indispensable pour traverser des rivières ou fuir des zones inondées.",
        choices: [
            {
                text: "traverser le fleuve à la nage",
                effects: {
                    black_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 }
                }
            },
            {
                text: "Rester sur les hauteurs",
                effects: {
                    black_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 }
                }
            }
        ]
    },
    {
        id: "env_heat",
        title: "Canicule",
        description: "Une vague de chaleur exceptionnelle frappe la région.",
        scientificInfo: "Le savais-tu ? Les chevaux sont sujets aux coups de chaleur (hyperthermie) qui peuvent rapidement devenir mortels si leur température corporelle interne dépasse un certain seuil, surtout en l'absence d'eau.",
        choices: [
            {
                text: "Chercher l'ombre",
                effects: {
                    black_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 }
                }
            },
            {
                text: "Continuer normalement",
                effects: {
                    black_horse: { Autorité: -15, confiance: -10, hierarchie: 0, cohesion: -10 },
                    brown_horse: { Autorité: -10, confiance: -15, hierarchie: 0, cohesion: -10 },
                    white_horse: { Autorité: -10, confiance: -10, hierarchie: 0, cohesion: -10 }
                }
            }
        ]
    },
    {
        id: "social_play",
        title: "Jeu entre jeunes chevaux",
        description: "Les jeunes du troupeau se mettent à jouer vivement ensemble.",
        scientificInfo: "Le savais-tu ? Les comportements de jeu chez les jeunes chevaux permettent d'affiner la coordination motrice et les codes sociaux, sans enjeu direct de hiérarchie.",
        choices: [
            {
                text: "Laisser le jeu se dérouler",
                effects: {
                    black_horse: { Autorité: 0, confiance: 5, hierarchie: 0, cohesion: 10 },
                    brown_horse: { Autorité: 0, confiance: 10, hierarchie: 0, cohesion: 10 },
                    white_horse: { Autorité: 0, confiance: 5, hierarchie: 0, cohesion: 5 }
                }
            },
            {
                text: "Interrompre pour garder le calme",
                effects: {
                    black_horse: { Autorité: 0, confiance: -5, hierarchie: 0, cohesion: -10 },
                    brown_horse: { Autorité: 0, confiance: -10, hierarchie: 0, cohesion: -15 },
                    white_horse: { Autorité: 0, confiance: -5, hierarchie: 0, cohesion: -15 }
                }
            }
        ]
    },
    {
        id: "resource_trail",
        title: "Choix d’un nouveau chemin",
        description: "Deux itinéraires s’offrent au troupeau pour rejoindre l’herbe fraîche.",
        scientificInfo: "Le savais-tu ? Lors des déplacements, ce sont souvent les individus les plus expérimentés qui initient la direction, les autres suivant par contagion de mouvement plutôt que par obéissance au sens humain du terme.",
        choices: [
            {
                text: "Suivre l’itinéraire des plus âgés",
                effects: {
                    black_horse: { Autorité: 5, confiance: 10, hierarchie: 0, cohesion: 10 },
                    brown_horse: { Autorité: 0, confiance: 10, hierarchie: 0, cohesion: 15 },
                    white_horse: { Autorité: 0, confiance: 10, hierarchie: 0, cohesion: 15 }
                }
            },
            {
                text: "Explorer le nouveau chemin",
                effects: {
                    black_horse: { Autorité: -15, confiance: -10, hierarchie: 0, cohesion: -10 },
                    brown_horse: { Autorité: -10, confiance: -10, hierarchie: 0, cohesion: -15 },
                    white_horse: { Autorité: -15, confiance: -10, hierarchie: 0, cohesion: -15 }
                }
            }
        ]
    },
    {
        id: "health_parasites",
        title: "Parasites internes",
        description: "Plusieurs chevaux maigrissent malgré une nourriture suffisante.",
        scientificInfo: "Le savais-tu ? Les parasites internes dégradent l’état général et la mobilité du cheval. Cette baisse de forme peut entraîner une chute de son rang social au sein du troupeau.",
        choices: [
            {
                text: "Ralentir pour laisser se reposer les plus atteints",
                effects: {
                    black_horse: { Autorité: -15, confiance: 0, hierarchie: -15, cohesion: -5 },
                    brown_horse: { Autorité: -10, confiance: 5, hierarchie: -10, cohesion: -5 },
                    white_horse: { Autorité: -10, confiance: 5, hierarchie: -15, cohesion: -5 }
                }
            },
            {
                text: "Maintenir le rythme du troupeau",
                effects: {
                    black_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { Autorité: 0, confiance: 0, hierarchie: 0, cohesion: 0 }
                }
            }
        ]
    }
];
   // Fonction pour mélanger (Algorithme de Fisher-Yates)
   function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Fonction pour sélectionner des situations aléatoires 
function selectRandomSituations() {
    let availableSituations = baseSituations.filter(situation => !globalUsedSituations.has(situation.id));

    if (availableSituations.length < 7) {
        console.log("Cycle terminé ou insuffisant. Réinitialisation de la mémoire des situations.");
        globalUsedSituations.clear();
        // Reprendre toutes les situations
        availableSituations = [...baseSituations];
    }
    // Mélanger les situations disponibles
    const shuffled = shuffleArray([...availableSituations]);
    
    // On retourne les 7 premières
    return shuffled.slice(0, 7);
}

// Scène : Écran d'accueil
scene("welcome", () => {
    // Jouer la musique de fond
    if (!gameState.musicPlaying) {
        try {
            play("background_music", { loop: true, volume: 0.3 });
            gameState.musicPlaying = true;
        } catch (error) {
            console.warn("Erreur lors de la lecture de la musique de fond:", error);
        }
    }

    // Fond
    add([
        rect(width(), height()),
        color(135, 206, 235),
        fixed()
    ]);

    // Titre du jeu
    add([
        text("MINDHerd", { size: 64, font: "Times New Roman" }),
        pos(width()/2, height()/4 ),
        anchor("center"),
        color(0, 0, 0),
        fixed()
    ]);

    add([
        text("Dynamiques sociales équines", { size: 32,font: "Times New Roman"}),
        pos(width()/2, height()/3 + 40),
        anchor("center"),
        color(0, 0, 0),
        fixed()
    ]);
 
    // Créer le bouton "JOUER"
    const jouerBtn = add([
        rect(200, 60),       
        pos(width()/2, height()/2 + 70),      
        anchor("center"),    
        color(0, 0, 0),      
        area(),              
        z(1),
    ]);
    
    const jouerTxt = add([
        text("JOUER", { size: 32, font: "Times New Roman"}),
        pos(width()/2, height()/2+ 70),
        anchor("center"),
        color(255, 255, 255), 
        fixed(),
        z(2),
    ]);

    // Effet visuel au survol
    jouerBtn.onHover(() => {
        jouerBtn.color = rgb(19, 164, 236); 
        setCursor("pointer");
    });

    jouerBtn.onHoverEnd(() => {
        jouerBtn.color = rgb(0, 0, 0); 
        setCursor("default");
    });

    jouerBtn.onClick(() => {
        playGameSound("click", { volume: 0.3 });
        go("main");
    });

    // Texte d'instruction
    add([
        text("Appuyez sur ESPACE pour lancer le jeu", { size: 20, font: "Times New Roman"}),
        pos(width()/2, height()/2 + 150),
        anchor("center"),
        color(0, 0, 0),
        fixed(),
        z(9)
    ]);

   
    // Navigation au clavier
    onKeyPress("space", () => {
        go("main");
    });
});

// Scène : sélection du cheval
scene("main", () => {
    
    // Fond
    add([
        sprite("background"),
        scale(1.5, 1.5),
        color(56, 189, 223 ,0),
        fixed()
    ]);

    const horseTypes = [
        { 
            name: "Noir", 
            sprite: "black_horse", 
            description: "Un cheval au rôle moteur dans les déplacements du troupeau" 
        },
        { 
            name: "Brun", 
            sprite: "brown_horse", 
            description: "Un cheval attentif aux signaux des autres, sensible aux tensions sociales" 
        },
        { 
            name: "Blanc", 
            sprite: "white_horse", 
            description: "Un cheval observateur, souvent en retrait mais très vigilant" 
        }
    ];

    let selectedHorse = 0;
    const horsePreview = add([
        sprite(horseTypes[selectedHorse].sprite),
        pos(width()/2, height()/2),
        scale(0.8),
        anchor("center")
    ]);

    // Interface de sélection
    add([
        text("Choisissez votre apparence", { size: 32, font: "Times New Roman"}),
        pos(width()/2, 100),
        anchor("center"),
        color(0, 0, 0),
        fixed()
    ]);

    // Description du cheval sélectionné
    const descriptionText = add([
        text(horseTypes[selectedHorse].description, { size: 20, font: "Times New Roman" }),
        pos(width()/2, height()/2 + 200),
        anchor("center"),
        color(0, 0, 0),
        fixed()
    ]);

    // Boutons de navigation
    const leftButton = add([
        rect(50, 50),
        pos(width()/2 - 300, height()/2),
        anchor("center"),
        color(0, 0, 0),
        "navButton",
        area()
    ]);

    const rightButton = add([
        rect(50, 50),
        pos(width()/2 + 300, height()/2),
        anchor("center"),
        color(0, 0, 0),
        "navButton",
        area()
    ]);

    add([
        text("←", { size: 32, font: "Times New Roman"}),
        pos(width()/2 - 300, height()/2),
        anchor("center"),
        color(255, 255, 255)
    ]);

    add([
        text("→", { size: 32, font: "Times New Roman"}),
        pos(width()/2 + 300, height()/2),
        anchor("center"),
        color(255, 255, 255)
    ]);

    leftButton.onHover(() => {
        leftButton.color = rgb(19, 164, 236);
        setCursor("pointer");
    });

    leftButton.onHoverEnd(() => {
        leftButton.color = rgb(0, 0, 0);
        setCursor("default");
    });

    rightButton.onHover(() => {
        rightButton.color = rgb(19, 164, 236);
        setCursor("pointer");
    });

    rightButton.onHoverEnd(() => {
        rightButton.color = rgb(0, 0, 0);
        setCursor("default");
    });

    // Gestion des clics pour changer de cheval
    leftButton.onClick(() => {
        playGameSound("click", { volume: 0.3 });
        selectedHorse = (selectedHorse - 1 + horseTypes.length) % horseTypes.length;
        horsePreview.use(sprite(horseTypes[selectedHorse].sprite));
        if (horseTypes[selectedHorse].sprite === "black_horse") {
            horsePreview.scale = vec2(0.8);
        } else if (horseTypes[selectedHorse].sprite === "brown_horse") {
            horsePreview.scale = vec2(0.45);
        } else {
            horsePreview.scale = vec2(0.22);
        }
        descriptionText.text = horseTypes[selectedHorse].description;
    });

    rightButton.onClick(() => {
        playGameSound("click", { volume: 0.3 });
        selectedHorse = (selectedHorse + 1) % horseTypes.length;
        horsePreview.use(sprite(horseTypes[selectedHorse].sprite));
        if (horseTypes[selectedHorse].sprite === "black_horse") {
            horsePreview.scale = vec2(0.8);
        } else if (horseTypes[selectedHorse].sprite === "brown_horse") {
            horsePreview.scale = vec2(0.45);
        } else {
            horsePreview.scale = vec2(0.22);
        }
        descriptionText.text = horseTypes[selectedHorse].description;
    });

    // Bouton Commencer
    const startButton = add([
        rect(300, 50),
        pos(width()/2, height() - 100),
        anchor("center"),
        color(0, 0, 0),
        "startButton",
        area()
    ]);

    add([
        text("COMMENCER", { size: 32, font: "Times New Roman"}),
        pos(width()/2, height() - 100),
        anchor("center"),
        color(255, 255, 255)
    ]);

    startButton.onHover(() => {
        startButton.color = rgb(19, 164, 236);
        setCursor("pointer");
    });

    startButton.onHoverEnd(() => {
        startButton.color = rgb(0, 0, 0);
        setCursor("default");
    });

    startButton.onClick (() => {
        playGameSound("click", { volume: 0.3 });
        startGame(horseTypes[selectedHorse]);
    });

    onKeyPress("space", () => {
        startGame(horseTypes[selectedHorse]);
    });
});


// scene : Jeu 
scene("game", () => { 

    gameState.herd = [];
    gameState.player = null;

    gameState.stats = {
        Autorité: 100,
        confiance: 100,
        cohesion: 100,   
        hierarchie: 100    
    };
    gameState.currentBox = null;
    gameState.boxChoices = [];
    gameState.usedBoxes = new Set();
    gameState.availableSituations = selectRandomSituations();
    gameState.usedBoxes.clear();

    // Fond
    add([
        sprite("background"),
        scale(1.5, 1.5),
        color(56, 189, 223 ,0), 
        fixed()
    ]);

    // Interface utilisateur en haut de l'écran
    const statsBg = add([
        rect(300, height()),
        pos(0, 0),
        color(0, 0, 0, 0.8),
        fixed(),
        z(99)
    ]);

    // Titre des statistiques
    add([
        text("STATISTIQUES", { size: 28, font: "Times New Roman" }),
        pos(20, 20),
        color(255, 255, 255),
        fixed(),
        z(100)
    ]);

    // Création des barres de statistiques 
    const statsBars = {
        Autorité: {
            bg: add([
                rect(200, 20),
                pos(20, 80),
                anchor("left"),
                color(80, 80, 80),
                fixed(),
                z(99)
            ]),
            bar: add([
                rect(200, 20),
                pos(20, 80),
                anchor("left"),
                color(255, 0, 0),
                fixed(),
                z(100)
            ]),
            targetWidth: 200, // 
            text: add([
                text("Autorité", { size: 20, font: "Times New Roman" }),
                pos(20, 60),
                anchor("left"),
                color(255, 255, 255),
                fixed(),
                z(100)
            ])
        },
        confiance: {
            bg: add([
                rect(200, 20),
                pos(20, 130),
                anchor("left"),
                color(80, 80, 80),
                fixed(),
                z(99)
            ]),
            bar: add([
                rect(200, 20),
                pos(20, 130),
                anchor("left"),
                color(0, 255, 0),
                fixed(),
                z(100)
            ]),
            targetWidth: 200, 
            text: add([
                text("Confiance", { size: 20, font: "Times New Roman" }),
                pos(20, 110),
                anchor("left"),
                color(255, 255, 255),
                fixed(),
                z(100)
            ])
        },
        cohesion: {
            bg: add([
                rect(200, 20),
                pos(20, 180),
                anchor("left"),
                color(80, 80, 80),
                fixed(),
                z(99)
            ]),
            bar: add([
                rect(200, 20),
                pos(20, 180),
                anchor("left"),
                color(0, 0, 255),
                fixed(),
                z(100)
            ]),
            targetWidth: 200, 
            text: add([
                text("Cohésion", { size: 20, font: "Times New Roman" }),
                pos(20, 160),
                anchor("left"),
                color(255, 255, 255),
                fixed(),
                z(100)
            ])
        },
        hierarchie: {
            bg: add([
                rect(200, 20),
                pos(20, 230),
                anchor("left"),
                color(80, 80, 80),
                fixed(),
                z(99)
            ]),
            bar: add([
                rect(200, 20),
                pos(20, 230),
                anchor("left"),
                color(255, 255, 0),
                fixed(),
                z(100)
            ]),
            targetWidth: 200, 
            text: add([
                text("Hiérarchie", { size: 20, font: "Times New Roman" }),
                pos(20, 210),
                anchor("left"),
                color(255, 255, 255),
                fixed(),
                z(100)
            ])
        }
    };

    // Ajouter le cheval sélectionné 
    const selectedHorsePreview = add([
        sprite(gameState.selectedHorse.sprite),
        pos(150, height() - 100),
        anchor("center"),
        fixed(),
        z(100)
    ]);

    // Ajuster l'échelle selon cheval
    if (gameState.selectedHorse.sprite === "black_horse") {
        selectedHorsePreview.scale = vec2(0.55);
    } else if (gameState.selectedHorse.sprite === "brown_horse") {
        selectedHorsePreview.scale = vec2(0.30);
    } else {
        selectedHorsePreview.scale = vec2(0.12);
    }

    // Fonction pour mettre à jour le compteur
    function updateRemainingCount() {
        const remaining = gameState.availableSituations.length - gameState.usedBoxes.size;
        return `Situations restantes: ${remaining}`;
    }

    // Fonction pour afficher le changement de statistique 
    function showStatChange(stat, value) {
        if (!statsBars[stat] || !statsBars[stat].text) return;
        
        const color = value > 0 ? rgb(0, 255, 0) : rgb(255, 0, 0);
        const symbol = value > 0 ? "↑" : "↓";
        const magnitude = Math.min(3, Math.max(1, Math.ceil(Math.abs(value) / 10)));
        const display = symbol.repeat(magnitude);

        const changeText = add([
            text(display, { size: 24, font: "Times New Roman" }),
            pos(250, statsBars[stat].text.pos.y),
            color,
            fixed(),
            z(101)
        ]);

        // Animation de déplacement vers le haut et disparition
        changeText.move(vec2(0, -30), 1);
        changeText.opacity = 1;

        wait(1, () => changeText.destroy());
    }

    // Fonction pour mettre à jour les statistiques 
    function updateStats() {
        Object.entries(gameState.stats).forEach(([stat, value]) => {
            if (statsBars[stat] && statsBars[stat].bar) {
                statsBars[stat].targetWidth = (value / 100) * 200;
                // statsBars[stat].targetScale = gameState.stats[stat] / 100;

            }
        });
    }
    
    // Fonction pour animer les jauges 
    function animateBars() {
        Object.keys(statsBars).forEach(stat => {
            if (statsBars[stat] && statsBars[stat].bar) {
                const currentWidth = statsBars[stat].bar.width;
                const targetWidth = statsBars[stat].targetWidth || 200;
                
                // Animation de la jauge
                if (Math.abs(currentWidth - targetWidth) > 0.5) {
                    const speed = 0.2; 
                    const diff = targetWidth - currentWidth;
                    statsBars[stat].bar.width = currentWidth + (diff * speed);
                    
                    // Reste dans les limites de la largeur des barres
                    statsBars[stat].bar.width = Math.max(0, Math.min(200, statsBars[stat].bar.width));
                } else {
                    statsBars[stat].bar.width = targetWidth;
                }
            }
        });
    }
   
    // Initialiser les jauges à 100% au démarrage
    updateStats();

    // Boucle de jeu pour l'animation
    onUpdate(() => {
        animateBars();
    });

    // Fonction pour choisir une nouvelle box
    function chooseNewBox() {
        const availableBoxes = gameState.availableSituations.filter(box => !gameState.usedBoxes.has(box.id));
        
        if (availableBoxes.length === 0) {
            showFinalScreen();
            return null;
        }
        return choose(availableBoxes);
    }
// Fonction pour afficher l'écran final
function showFinalScreen(isGameOver = false, cause = "") {
    get("boxElement").forEach(element => element.destroy());

    // Fond
    add([
        rect(900, 600),
        pos(width()/2 + 150, height()/2),
        anchor("center"),
        color(0, 0, 0, 0.85), 
        fixed(),
        z(100),
        "boxElement"
    ]);

    let titleText = "Fin de la partie";
    let colorTitle = rgb(255, 255, 255);

    // Si c'est un Game Over (une jauge à 0)
    if (isGameOver) {
        titleText = "TROUPEAU DISPERSÉ";
        colorTitle = rgb(255, 50, 50); 
    }

    add([
        text(titleText, { size: 48, font: "Times New Roman" }),
        pos(width()/2 + 150, height()/2 - 200),
        anchor("center"),
        color(colorTitle),
        fixed(),
        z(101),
        "boxElement"
    ]);

    // Message selon victoire ou défaite
    if (isGameOver) {
        // Message défaite
        add([
            text(`Le niveau de ${cause} est tombé à zéro.`, { size: 32, font: "Times New Roman" }),
            pos(width()/2 + 150, height()/2 - 50),
            anchor("center"),
            color(255, 255, 255),
            fixed(),
            z(101),
            "boxElement"
        ]);

        add([
            text("Le troupeau n'a pas survécu à ce déséquilibre.\nLa cohésion sociale s'est effondrée.", { size: 24, font: "Times New Roman", align: "center" }),
            pos(width()/2 + 150, height()/2 + 50),
            anchor("center"),
            color(200, 200, 200),
            fixed(),
            z(101),
            "boxElement"
        ]);

    } else {
        // Calcul de la moyenne
        const average = Math.round(
            (gameState.stats.Autorité + 
             gameState.stats.confiance + 
             gameState.stats.cohesion + 
             gameState.stats.hierarchie) / 4
        );

        add([
            text(`Score Moyen: ${average}/100`, { size: 36, font: "Times New Roman" }),
            pos(width()/2 + 150, height()/2 - 100),
            anchor("center"),
            color(average >= 50 ? rgb(0, 255, 0) : rgb(255, 0, 0)),
            fixed(),
            z(101),
            "boxElement"
        ]);

        // Message de conclusion
        let conclusion = "";
        let moral = "";
        const horseType = gameState.selectedHorse.sprite;

        if (average >= 80) {
            conclusion = "Excellente gestion du troupeau! les chevaux sont très soudés.";
            if (horseType === "black_horse") {
                moral = "Malgré tout, tu as su maintenir un équilibre entre autorité et respect.";
            } else if (horseType === "brown_horse") {
                moral = "Ton empathie naturelle a permis de créer des liens forts au sein du troupeau.";
            } else {
                moral = "Ta clairvoyance a permis de guider le troupeau avec sagesse.";
            }
        } else if (average >= 60) {
            conclusion = "Le troupeau est stable.";
            if (horseType === "black_horse") {
                moral = "Tu as parfois été trop directif, mais le troupeau reste uni.";
            } else if (horseType === "brown_horse") {
                moral = "Ton empathie a permis de maintenir la cohésion, même si certaines décisions ont été difficiles.";
            } else {
                moral = "Ta clairvoyance a permis de prévoir les situations, même si certaines décisions ont été complexes.";
            }
        } else if (average >= 40) {
            conclusion = "Le troupeau est fragile.";
            if (horseType === "black_horse") {
                moral = "Tu as parfois manqué de nuance, créant des tensions dans le troupeau.";
            } else if (horseType === "brown_horse") {
                moral = "Ton empathie a parfois été un frein à la prise de décisions nécessaires.";
            } else {
                moral = "Ta clairvoyance a parfois été troublée par les émotions du moment.";
            }
        } else {
            conclusion = " Le troupeau est en difficulté.";
            if (horseType === "black_horse") {
                moral = "Tu as été trop autoritaire, créant des divisions dans le troupeau.";
            } else if (horseType === "brown_horse") {
                moral = "Ton empathie excessive a empêché le troupeau de prendre les décisions difficiles.";
            } else {
                moral = "Ta clairvoyance a été obscurcie par les pressions du moment.";
            }
        }

        add([
            text(conclusion, { size: 24, font: "Times New Roman" }),
            pos(width()/2 + 150, height()/2 + 50),
            anchor("center"),
            color(255, 255, 255),
            fixed(),
            z(101),
            "boxElement"
        ]);

        add([
            text(moral, { size: 20, font: "Times New Roman" }),
            pos(width()/2 + 150, height()/2 + 100),
            anchor("center"),
            color(255, 255, 255),
            fixed(),
            z(101),
            "boxElement"
        ]);
    }

    // Bouton Recommencer
    const restartBtn = add([
        rect(250, 60),
        pos(width()/2 + 150, height()/2 + 180),
        anchor("center"),
        color(50, 50, 50),
        area(),
        fixed(),
        z(101),
        "boxElement"
    ]);

    add([
        text("Recommencer", { size: 28, font: "Times New Roman" }),
        pos(width()/2 + 150, height()/2 + 180),
        anchor("center"),
        color(255, 255, 255),
        fixed(),
        z(102),
        "boxElement"
    ]);

    restartBtn.onHover(() => { restartBtn.color = rgb(19, 164, 236); setCursor("pointer"); });
    restartBtn.onHoverEnd(() => { restartBtn.color = rgb(50, 50, 50); setCursor("default"); });
    restartBtn.onClick(() => go("main"));
}

    // Fonction pour afficher une box
    function showBox(box) {
        if (!box) {
            return;
        }
        gameState.usedBoxes.add(box.id);
        globalUsedSituations.add(box.id);
        
        if (gameState.currentBox) {
            get("boxElement").forEach(element => {
                element.destroy();
            });
        } 
        gameState.currentBox = box;
        
        // Jouer le son approprié selon le type de situation
        switch(box.id) {
            case "danger_storm":
                playGameSound("thunder", { volume: 0.4 });
                break;
            case "danger_predator":
                playGameSound("wolf_howl", { volume: 0.4 });
                break;
            case "conflict_food":
            case "conflict_territory":
            case "conflict_hierarchy":
            case "social_new_member":
                playGameSound("horse_neigh", { volume: 0.4 });
                break;
        }
        
        // Fond de la box
        const boxBg = add([
            sprite("background"),
            scale(1, 1),
            pos(width()/2 + 150, height()/2),
            anchor("center"),
            color(56, 189, 223 ,0),
            fixed(),
            z(100),
            "boxElement"
        ]);

        // Titre de la box
        add([
            text(box.title, { size: 32, font: "Times New Roman",  }),
            pos(width()/2 + 150, height()/2 - 150),
            anchor("center"),
            color(255, 255, 255),
            fixed(),
            z(101),
            "boxElement"
        ]);

        // Description de la situation
        add([
            text(box.description, { size: 24, font: "Times New Roman" }),
            pos(width()/2 + 150, height()/2 - 100),
            anchor("center"),
            color(255, 255, 255),
            fixed(),
            z(101),
            "boxElement"
        ]);

        // Compteur de situations 
        add([
            text(updateRemainingCount(), { size: 20, font: "Times New Roman" }),
            pos(width()/2 + 50 + (width() - 350)/2 - 20, height()/2 + (height() - 200)/2 - 20),
            anchor("right"),
            color(255, 255, 255),
            fixed(),
            z(101),
            "boxElement"
        ]);

        // Créer les boutons de choix
        box.choices.forEach((choice, index) => {
            const button = add([
                rect(450, 50),
                pos(width()/2 + 150, height()/2 + (index * 70)),
                anchor("center"),
                color(50, 50, 50),
                fixed(),
                z(101),
                area(),
                "boxElement"
            ]);

            add([
                text(choice.text, { size: 20, font: "Times New Roman" }),
                pos(width()/2 + 150, height()/2 + (index * 70)),
                anchor("center"),
                color(255, 255, 255),
                fixed(),
                z(102),
                "boxElement"
            ]);

            // Gestion des événements bouton
            button.onHover(() => {
                button.color = rgb(19, 164, 236); 
                setCursor("pointer");
                playGameSound("hover", { volume: 0.2 });
            });

            button.onHoverEnd(() => {
                button.color = rgb(50, 50, 50); 
                setCursor("default");
            });

            button.onClick(() => {
                playGameSound("click", { volume: 0.3 });
                const horseType = gameState.selectedHorse.sprite;
                const effects = choice.effects[horseType];
                
                // Variable pour savoir si on a perdu
                let gameOver = false;
                let failureReason = "";

                // Appliquer les effets des choix
                Object.entries(effects).forEach(([stat, value]) => {
                    gameState.stats[stat] = gameState.stats[stat] + value;
                    
                    // Vérifier si la jauge est vide 
                    if (gameState.stats[stat] <= 0) {
                        gameState.stats[stat] = 0; 
                        gameOver = true;
                        failureReason = stat; 
                    }
    
                    // Bloquer le maximum à 100
                    if (gameState.stats[stat] > 100) {
                        gameState.stats[stat] = 100;
                    }

                    showStatChange(stat, value); 
                });
                
                updateStats(); 

                // Nettoyer l'interface de la question
                get("boxElement").forEach(element => {
                    element.destroy();
                });
                gameState.currentBox = null;

                // Vérifier si le jeu est terminé
                if (gameOver) {
                    // Si une jauge est à 0, on va direct à l'écran final après une courte pause
                    wait(1, () => {
                        showFinalScreen(true, failureReason);
                    });
                } else {
                    
                    // Afficher le fait scientifique 
                    add([
                        text(box.scientificInfo, { size: 24, font: "Times New Roman", width: 600 }),
                        pos(width()/2 + 150, height()/2),
                        anchor("center"),
                        color(255, 255, 255), 
                        fixed(),
                        z(101),
                        "boxElement"
                    ]);

                    // Jouer le hennissement et afficher le bouton suivant
                    wait(0.5, () => {
                        playGameSound("horse_neigh", { volume: 0.3 });

                        // Bouton Suivant
                        const nextButton = add([
                            rect(200, 50),
                            pos(width()/2 + 350, height()/2 + 220),
                            anchor("left"),
                            color(50, 50, 50),
                            fixed(),
                            z(101),
                            area(),
                            "boxElement"
                        ]);

                        add([
                            text("Suivant", { size: 24, font: "Times New Roman" }),
                            pos(width()/2 + 410, height()/2 + 220),
                            anchor("left"),
                            color(255, 255, 255),
                            fixed(),
                            z(102),
                            area(),
                            "boxElement"
                        ]);

                        // Gestion des événements du bouton
                        nextButton.onHover(() => {
                            nextButton.color = rgb(19, 164, 236);
                            setCursor("pointer");
                            playGameSound("hover", { volume: 0.2 });
                        });

                        nextButton.onHoverEnd(() => {
                            nextButton.color = rgb(50, 50, 50);
                            setCursor("default");
                        });

                        nextButton.onClick(() => {
                            playGameSound("click", { volume: 0.3 });
                            get("boxElement").forEach(element => {
                                element.destroy();
                            });
                            
                            // Passer à la question suivante
                            const nextBox = chooseNewBox();
                            showBox(nextBox);
                        });
                    });
                }
            });
        });
    }

    // Afficher la première box au démarrage de la scène Game
    const firstBox = chooseNewBox();
    showBox(firstBox);

    // Bouton de contrôle du son
    const soundButton = add([
        rect(40, 40),
        pos(width() - 30, 30),
        anchor("center"),
        color(50, 50, 50),
        fixed(),
        z(100),
        area(),
        "soundButton"
    ]);

    // Icône du son
    const soundIcon = add([
        text("🔊", { size: 24 }),
        pos(width() - 30, 30),
        anchor("center"),
        color(255, 255, 255),
        fixed(),
        z(101),
        "soundIcon"
    ]);

    // Gestion des événements du bouton son
    soundButton.onHover(() => {
        soundButton.color = rgb(19, 164, 236);
        setCursor("pointer");
    });

    soundButton.onHoverEnd(() => {
        soundButton.color = rgb(50, 50, 50);
        setCursor("default");
    });

    soundButton.onClick(() => {
        gameState.soundEnabled = !gameState.soundEnabled;
        soundIcon.text = gameState.soundEnabled ? "🔊" : "🔇";
        
        if (!gameState.soundEnabled) {
            Object.keys(sounds).forEach(sound => {
                try {
                    stop(sound);
                } catch (error) {
                    console.warn(`Impossible d'arrêter le son ${sound}: ${error.message}`);
                }
            });
        } else if (gameState.musicPlaying) {
            playGameSound("background_music", { loop: true, volume: 0.3 });
        }
    });

}); 

// Fonction de démarrage du jeu
function startGame(selectedHorse) {
    gameState.selectedHorse = selectedHorse;
    go("game");
}

// Attendre que tout soit chargé avant de redémarrer
onLoad(() => {
    go("welcome");
});