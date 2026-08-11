export type Language = 'en' | 'ar';

export interface TranslationDictionary {
  [key: string]: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    // Navigation
    brandName: 'SAOUDI WEAR',
    home: 'Home',
    collections: 'Collections',
    shop: 'Catalog',
    bespoke: 'Bespoke',
    horology: 'Horology',
    heritage: 'Heritage',
    atelier: 'Atelier',
    concierge: 'Concierge',
    search: 'Search',
    wishlist: 'Wishlist',
    bag: 'Shopping Bag',

    // Hero Section
    heroSubtitle: 'Haute Horology & Bespoke Tailoring',
    heroTitle: 'THE OBSIDIAN CHRONOGRAPH',
    heroDesc: 'Automatic Caliber SW500 encased in 42mm Rose Gold PVD. Domed sapphire glass with stealth dark aesthetic.',
    discoverWatch: 'Discover Timepiece',
    exploreBespoke: 'Explore Bespoke Suits',

    // Bento Grid Section
    curatedCollectionsTitle: 'HAUTE HOROLOGY & BESPOKE TAILORING',
    curatedCollectionsSubtitle: 'Curated Atelier Collections',
    tailoringCategory: 'Bespoke Tailoring',
    tailoringTitle: 'Super 150s Double-Breasted Suit',
    tailoringDesc: 'Precision cut from Biella wool with hand-stitched pick detailing and carved horn buttons.',
    horologyCategory: 'Haute Horology',
    horologyTitle: 'The Obsidian Chronograph',
    horologyDesc: 'Automatic Caliber SW500 with 42mm Rose Gold PVD case & domed sapphire crystal.',
    outerwearCategory: 'Outerwear',
    outerwearTitle: 'Italian Wool-Cashmere Overcoats',
    knitwearCategory: 'Knitwear',
    knitwearTitle: 'Mongolian Cashmere Turtlenecks',
    knitwearDesc: 'Grade-A Mongolian cashmere knitted for soft weightless luxury and optimal temperature control.',
    accessoriesCategory: 'Leather & Accessories',
    accessoriesTitle: 'Florentine Full-Grain Leather Derbys',
    accessoriesDesc: 'Handcrafted Blake-stitched derbys forged with premium Italian leather and gold accent detailing.',
    privateConciergeCategory: 'Private Atelier',
    privateConciergeTitle: 'Bespoke Concierge & Private Trunk Show',
    privateConciergeDesc: 'Request a private appointment with our master tailors & watchmakers.',
    exploreCollection: 'Explore Collection',

    // Product Grid
    catalogTitle: 'Atelier Catalogue',
    catalogSubtitle: 'Limited Edition Timepieces & Tailored Menswear',
    filterAll: 'All Collections',
    filterTimepieces: 'Timepieces',
    filterSuits: 'Suits',
    filterCoats: 'Coats & Jackets',
    filterKnitwear: 'Knitwear',
    filterAccessories: 'Accessories',
    filterOuterwear: 'Outerwear',
    addToBag: 'Add to Bag',
    quickView: 'Quick View',

    // Heritage Section
    heritageSubtitle: 'ATELIER HERITAGE',
    heritageTitle: 'Uncompromising Craftsmanship Since 1994',
    heritageDesc: 'Every SAOUDI WEAR creation is an amalgamation of Swiss horological precision and Italian bespoke sartorial mastery. Forged for modern leaders who command the room in silence.',
    readStory: 'Discover Our Story',

    // Footer & Newsletter
    newsletterTitle: 'JOIN THE SAOUDI WEAR PRIVATE CIRCLE',
    newsletterSubtitle: 'Receive exclusive invitations to private trunk shows, limited watch drops, and sartorial previews.',
    subscribe: 'Request Invitation',
    emailPlaceholder: 'Enter your email address',
    copyright: '© 2026 SAOUDI WEAR Atelier. All Rights Reserved.',
  },
  ar: {
    // Navigation
    brandName: 'SAOUDI WEAR',
    home: 'الرئيسية',
    collections: 'المجموعات الملكية',
    shop: 'الكتالوج',
    bespoke: 'التفصيل الخصيص',
    horology: 'الساعات الفاخرة',
    heritage: 'الإرث',
    atelier: 'الأتليه',
    concierge: 'المساعد الشخصي',
    search: 'بحث',
    wishlist: 'المفضلة',
    bag: 'حقيبة التسوق',

    // Hero Section
    heroSubtitle: 'صناعة الساعات الفاخرة والخياطة الراقية',
    heroTitle: 'كرونوغراف الأوبسيديان الملكي',
    heroDesc: 'ساعة اتوماتيكية بعيار SW500 في علبة من الذهب الوردي 42 مم بطلاء PVD مع زجاج سافير فاخر.',
    discoverWatch: 'اكتشف التحفة الساعاتية',
    exploreBespoke: 'استكشف البدلات الملكية',

    // Bento Grid Section
    curatedCollectionsTitle: 'ساعات فاخرة وخياطة راقية',
    curatedCollectionsSubtitle: 'مجموعات الأتليه الخاصة',
    tailoringCategory: 'الخياطة الفاخرة',
    tailoringTitle: 'بدلة كلاسيكية من صوف Super 150s',
    tailoringDesc: 'قصة دقيقة من صوف ببييلا الإيطالي مع تفاصيل مخيطة يدوياً وأزرار قرن غزال منحوتة.',
    horologyCategory: 'صناعة الساعات',
    horologyTitle: 'كرونوغراف الأوبسيديان',
    horologyDesc: 'عيار اتوماتيكي SW500 مع هيكل ذهب وردي 42 مم وزجاج سافير مقوس.',
    outerwearCategory: 'المعاطف',
    outerwearTitle: 'معاطف الجوخ والصوف الإيطالي',
    outerwearDesc: 'معاطف كلاسيكية مصممة ببراعة من مزيج الصوف والكشمير الإيطالي الفاخر.',
    knitwearCategory: 'الكشمير الفاخر',
    knitwearTitle: 'كنزات الكشمير المنغولي الفاخر',
    knitwearDesc: 'حياكة فاخرة من صوف الكشمير المنغولي الصافي لنعومة ودفء استثنائيين.',
    accessoriesCategory: 'الجلد والإكسسوارات',
    accessoriesTitle: 'أحذية ديربي جلد فلورنسي فاخر',
    accessoriesDesc: 'صُنعت يدوياً بخياطة بليك في فلورنسا من أجود أنواع الجلود الإيطالية والتفاصيل الذهبية.',
    privateConciergeCategory: 'الأتليه الخاص',
    privateConciergeTitle: 'خدمة التفصيل الخاص والاستشارات الملكية',
    privateConciergeDesc: 'احجز جلسة قياس خاصة مع خياطي الأتليه وصناع الساعات في جناحك الخاص.',
    exploreCollection: 'استكشف المجموعة',

    // Product Grid
    catalogTitle: 'كتالوج الأتليه',
    catalogSubtitle: 'ساعات إكسسوارات وملابس رجالية ذات إصدار محدود',
    filterAll: 'جميع المجموعات',
    filterTimepieces: 'الساعات',
    filterSuits: 'البدلات',
    filterCoats: 'المعاطف والجاكيتات',
    filterKnitwear: 'الملابس الحياكة',
    filterAccessories: 'الإكسسوارات',
    filterOuterwear: 'المعاطف الخارجية',
    addToBag: 'أضف للحقيبة',
    quickView: 'نظرة سريعة',

    // Heritage Section
    heritageSubtitle: 'إرث الأتليه',
    heritageTitle: 'حرفية فائقة منذ عام 1994',
    heritageDesc: 'كل إبداع من SAOUDI WEAR هو مزيج بين الدقة السويسرية في صناعة الساعات والبراعة الإيطالية في الخياطة الرفيعة.',
    readStory: 'اكتشف قصتنا',

    // Footer & Newsletter
    newsletterTitle: 'انضم إلى الدائرة الخاصة لـ SAOUDI WEAR',
    newsletterSubtitle: 'احصل على دعوات خاصة لمعارض العرض الحصري، وإصدارات الساعات المحدودة، والمعاينات الراقية.',
    subscribe: 'طلب دعوة',
    emailPlaceholder: 'أدخل بريدك الإلكتروني',
    copyright: '© 2026 أتليه SAOUDI WEAR. جميع الحقوق محفوظة.',
  },
};
