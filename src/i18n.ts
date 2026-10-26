import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      appName: "BFlix",
      tagline: "CINEMA STREAM",
      nav: {
        movies: "Movies",
        tvShows: "TV Series",
        aiFinder: "AI Vibe Finder",
        watchlist: "Watchlist"
      },
      hero: {
        topChoice: "Top Choice",
        watchStream: "Watch Stream",
        downloadMp4: "Download MP4",
        showDetails: "Show Details",
        director: "Dir:"
      },
      continueWatching: {
        title: "Continue Watching",
        subtitle: "Pick up right where you left off",
        resume: "Resume",
        remove: "Remove",
        clearAll: "Clear All",
        progress: "{{percent}}% watched",
        seasonEpisode: "S{{season}}:E{{episode}}"
      },
      tv: {
        seasons: "Seasons",
        episodes: "Episodes",
        seasonNum: "Season {{season}}",
        episodeNum: "Episode {{episode}}",
        selectEpisode: "Select Episode",
        airDate: "Air Date:",
        allSeasons: "All Seasons"
      },
      category: {
        label: "Select Category / Genre",
        subLabel: "Filter catalog across curated categories",
        trending: "Trending Now",
        popular: "Popular Movies",
        topRated: "Top Rated",
        upcoming: "Upcoming",
        action: "Action",
        adventure: "Adventure",
        animation: "Animation",
        comedy: "Comedy",
        crime: "Crime",
        documentary: "Documentary",
        drama: "Drama",
        family: "Family",
        fantasy: "Fantasy",
        history: "History",
        horror: "Horror",
        music: "Music",
        mystery: "Mystery",
        romance: "Romance",
        scifi: "Sci-Fi",
        thriller: "Thriller",
        war: "War",
        western: "Western",
        tvShows: "TV Shows & Series"
      },
      search: {
        placeholder: "Search titles...",
        button: "Search",
        reset: "Reset",
        resultsTitle: "Search Results",
        categoryTitle: "{{category}}",
        resultsFound: "Found {{count}} results for \"{{query}}\"",
        pageStatus: "Page {{page}} of {{totalPages}} • Total {{totalResults}} titles available",
        noResultsTitle: "No search matches found.",
        noResultsSub: "Try searching for simple title fragments or spelling changes.",
        lookupFailed: "BFlix Catalog Lookup Failed"
      },
      pagination: {
        previous: "Previous",
        next: "Next",
        pageOf: "Page {{page}} of {{totalPages}}"
      },
      ai: {
        title: "AI Movie Vibe Finder",
        subtitle: "Describe your current mood, plot idea, or favorite themes to get instant smart recommendations.",
        placeholder: "e.g., A mind-bending sci-fi thriller set in deep space with plot twists, or a cozy retro 80s comedy...",
        findButton: "Find Movies with AI",
        curatedTitle: "AI Curated Picks",
        curatedSub: "Tailored exclusively to match your description.",
        clear: "Clear Recommendations",
        searching: "Analyzing cinematic vibes..."
      },
      watchlist: {
        title: "Personal Archive Watchlist",
        subtitle: "Saved cinematic choices in your active browser session.",
        emptyTitle: "Your Watchlist is empty",
        emptySub: "Bookmark legendary titles from our spotlights or search results to build your personalized watchlist.",
        exploreBtn: "Explore Spotlight Movies"
      },
      card: {
        streamNow: "Stream Now",
        details: "Details",
        download: "Download"
      },
      modal: {
        cast: "Cast",
        overview: "Overview",
        genres: "Genres",
        releaseDate: "Release Date",
        rating: "Rating",
        runtime: "Runtime",
        close: "Close"
      },
      watch: {
        returnToCatalog: "Back to Catalog",
        nowStreaming: "Now Streaming",
        serverSwitch: "Select Server",
        nextEpisode: "Next Episode",
        prevEpisode: "Prev Episode",
        purePlayer: "Pure Video.js Player",
        adShieldStrict: "Strict Shield Active",
        adShieldBalanced: "Balanced Shield Active",
        adShieldOff: "Ad Shield Disabled"
      },
      download: {
        title: "Download Movie & Series",
        inBrowserEngine: "In-Browser Multi-Threaded Engine",
        fetchingManifest: "Fetching Stream Manifest...",
        downloadingChunks: "Downloading Chunks",
        stitching: "Stitching MP4...",
        complete: "Download Ready & Saved",
        pause: "Pause",
        resume: "Resume",
        cancel: "Cancel",
        ffmpegOption: "Or Download via FFmpeg CLI"
      },
      footer: {
        rights: "© BFlix Cinema. All rights reserved.",
        poweredBy: "Powered by"
      },
      lang: {
        en: "English",
        km: "ភាសាខ្មែរ"
      }
    }
  },
  km: {
    translation: {
      appName: "BFlix",
      tagline: "ខ្សែភាពយន្តអនឡាញ",
      nav: {
        movies: "ភាពយន្ត",
        tvShows: "រឿងភាគ (TV)",
        aiFinder: "ស្វែងរកភាពយន្ត AI",
        watchlist: "បញ្ជីទស្សនា"
      },
      hero: {
        topChoice: "ជម្រើសកំពូល",
        watchStream: "ទស្សនាឥឡូវនេះ",
        downloadMp4: "ទាញយក MP4",
        showDetails: "មើលលម្អិត",
        director: "អ្នកដឹកនាំ:"
      },
      continueWatching: {
        title: "ទស្សនាបន្ត",
        subtitle: "បន្តទស្សនាពីកន្លែងដែលអ្នកបានផ្អាក",
        resume: "បន្តទស្សនា",
        remove: "លុបចេញ",
        clearAll: "លុបទាំងអស់",
        progress: "បានទស្សនា {{percent}}%",
        seasonEpisode: "វគ្គ S{{season}}:E{{episode}}"
      },
      tv: {
        seasons: "រដូវកាល",
        episodes: "ភាគ",
        seasonNum: "រដូវកាលទី {{season}}",
        episodeNum: "ភាគទី {{episode}}",
        selectEpisode: "ជ្រើសរើសភាគ",
        airDate: "ថ្ងៃចាក់ផ្សាយ:",
        allSeasons: "រដូវកាលទាំងអស់"
      },
      category: {
        label: "ជ្រើសរើសប្រភេទភាពយន្ត / ចានរ៍",
        subLabel: "តម្រងតាមប្រភេទភាពយន្តដែលបានជ្រើសរើស",
        trending: "កំពុងពេញនិយម",
        popular: "ភាពយន្តល្បីៗ",
        topRated: "ពិន្ទុខ្ពស់បំផុត",
        upcoming: "ជិតចេញបញ្ចាំង",
        action: "សកម្មភាព (Action)",
        adventure: "ផ្សងព្រេង (Adventure)",
        animation: "អានីមេស្យុង (Animation)",
        comedy: "កំប្លែង (Comedy)",
        crime: "បទល្មើស (Crime)",
        documentary: "ឯកសារ (Documentary)",
        drama: "ដ្រាម៉ា (Drama)",
        family: "គ្រួសារ (Family)",
        fantasy: "អស្ចារ្យ (Fantasy)",
        history: "ប្រវត្តិសាស្ត្រ (History)",
        horror: "ភ័យរន្ធត់ (Horror)",
        music: "តន្ត្រី (Music)",
        mystery: "អាថ៌កំបាំង (Mystery)",
        romance: "ស្នេហា (Romance)",
        scifi: "វិទ្យាសាស្ត្រ (Sci-Fi)",
        thriller: "រំភើបញាប់ញ័រ (Thriller)",
        war: "សង្គ្រាម (War)",
        western: "បស្ចិមប្រទេស (Western)",
        tvShows: "រឿងភាគទូរទស្សន៍"
      },
      search: {
        placeholder: "ស្វែងរកចំណងជើងភាពយន្ត...",
        button: "ស្វែងរក",
        reset: "កំណត់ឡើងវិញ",
        resultsTitle: "លទ្ធផលស្វែងរក",
        categoryTitle: "{{category}}",
        resultsFound: "រកឃើញ {{count}} លទ្ធផលសម្រាប់ «{{query}}»",
        pageStatus: "ទំព័រ {{page}} នៃ {{totalPages}} • សរុប {{totalResults}} ចំណងជើង",
        noResultsTitle: "រកមិនឃើញភាពយន្តដែលត្រូវគ្នានោះទេ។",
        noResultsSub: "សូមព្យាយាមស្វែងរកពាក្យគន្លឹះខ្លីៗ ឬពិនិត្យមើលអក្ខរាវិរុទ្ធឡើងវិញ។",
        lookupFailed: "ការស្វែងរកកាតាឡុក BFlix បរាជ័យ"
      },
      pagination: {
        previous: "ទំព័រមុន",
        next: "ទំព័របន្ទាប់",
        pageOf: "ទំព័រ {{page}} នៃ {{totalPages}}"
      },
      ai: {
        title: "កម្មវិធីស្វែងរកភាពយន្តតាមអារម្មណ៍ AI",
        subtitle: "រៀបរាប់ពីអារម្មណ៍ បរិយាកាស ឬសាច់រឿងដែលអ្នកចង់ទស្សនា ដើម្បីទទួលបានការណែនាំឆ្លាតវៃភ្លាមៗ។",
        placeholder: "ឧទាហរណ៍៖ រឿងវិទ្យាសាស្ត្ររំភើបញាប់ញ័រនៅអវកាស ឬរឿងកំប្លែងលំហែអារម្មណ៍...",
        findButton: "ស្វែងរកភាពយន្តជាមួយ AI",
        curatedTitle: "ភាពយន្តដែល AI ជ្រើសរើសជូន",
        curatedSub: "តម្រូវជាពិសេសតាមការរៀបរាប់របស់អ្នក។",
        clear: "សម្អាតការណែនាំ",
        searching: "កំពុងវិភាគបរិយាកាសភាពយន្ត..."
      },
      watchlist: {
        title: "បញ្ជីភាពយន្តដែលបានរក្សាទុក",
        subtitle: "ភាពយន្តដែលបានរក្សាទុកក្នុងសេសសិនកម្មវិធីរុករករបស់អ្នក។",
        emptyTitle: "បញ្ជីទស្សនារបស់អ្នកនៅទំនេរ",
        emptySub: "ចំណាំភាពយន្តដែលអ្នកចូលចិត្តដើម្បីបង្កើតបញ្ជីទស្សនាផ្ទាល់ខ្លួនរបស់អ្នក។",
        exploreBtn: "ស្វែងរកភាពយន្ត"
      },
      card: {
        streamNow: "ទស្សនាឥឡូវ",
        details: "ព័ត៌មាន",
        download: "ទាញយក"
      },
      modal: {
        cast: "តួអង្គ",
        overview: "សង្ខេបរឿង",
        genres: "ប្រភេទ",
        releaseDate: "ថ្ងៃបញ្ចាំង",
        rating: "ពិន្ទុ",
        runtime: "រយៈពេល",
        close: "បិទ"
      },
      watch: {
        returnToCatalog: "ត្រឡប់ទៅកាតាឡុក",
        nowStreaming: "កំពុងចាក់ផ្សាយ",
        serverSwitch: "ជ្រើសរើសម៉ាស៊ីនបម្រើ (Server)",
        nextEpisode: "ភាគបន្ទាប់",
        prevEpisode: "ភាគមុន",
        purePlayer: "កម្មវិធីចាក់ Video.js",
        adShieldStrict: "ខែលការពារផ្ទាំងពាណិជ្ជកម្មតឹងរ៉ឹង",
        adShieldBalanced: "ខែលការពារផ្ទាំងពាណិជ្ជកម្មកម្រិតមធ្យម",
        adShieldOff: "បិទខែលការពារផ្ទាំងពាណិជ្ជកម្ម"
      },
      download: {
        title: "ទាញយកភាពយន្ត និងរឿងភាគ",
        inBrowserEngine: "ម៉ាស៊ីនទាញយកច្រើនខ្សែស្របក្នុង Browser",
        fetchingManifest: "កំពុងទាញយកទិន្នន័យស្ទ្រីម...",
        downloadingChunks: "កំពុងទាញយកផ្នែកវីដេអូ",
        stitching: "កំពុងផ្គុំជាឯកសារ MP4...",
        complete: "ទាញយករួចរាល់ និងបានរក្សាទុក",
        pause: "ផ្អាក",
        resume: "បន្ត",
        cancel: "បោះបង់",
        ffmpegOption: "ឬទាញយកតាមពាក្យបញ្ជា FFmpeg CLI"
      },
      footer: {
        rights: "© BFlix Cinema. រក្សាសិទ្ធិគ្រប់យ៉ាង។",
        poweredBy: "ឧបត្ថម្ភដោយ"
      },
      lang: {
        en: "English",
        km: "ភាសាខ្មែរ"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"]
    }
  });

export default i18n;
