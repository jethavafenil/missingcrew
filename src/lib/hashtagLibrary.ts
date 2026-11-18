// Master hashtag library supplied by the client (Missing Crew-Hashtags.docx). Labels are already
// CamelCase tag values. A tag that appears in two groups is listed once, under the first.
export const HASHTAG_LIBRARY: ReadonlyArray<{ group: string; labels: readonly string[] }> = [
  {
    group: 'Direction & Production',
    labels: ['Director', 'FilmDirector', 'CreativeDirector', 'AssistantDirector', 'FirstAssistantDirector', 'SecondAssistantDirector', 'ThirdAssistantDirector', 'AssociateDirector', 'ExecutiveProducer', 'Producer', 'LineProducer', 'CreativeProducer', 'CoProducer', 'AssociateProducer', 'ProductionManager', 'ProductionCoordinator', 'ProductionSupervisor', 'ProductionAssistant', 'UnitProductionManager', 'ProductionSecretary', 'ScriptSupervisor', 'ContinuitySupervisor', 'FloorManager', 'UnitManager', 'LocationManager', 'LocationScout', 'CastingDirector', 'CastingAssociate', 'CastingAssistant', 'TalentCoordinator', 'TalentManager'],
  },
  {
    group: 'Actors & Performance',
    labels: ['Actor', 'Actress', 'MaleActor', 'FemaleActor', 'ChildActor', 'SupportingActor', 'LeadActor', 'CharacterActor', 'BackgroundActor', 'JuniorArtist', 'ExtraArtist', 'VoiceActor', 'VoiceOverArtist', 'DubbingArtist', 'TheatreActor', 'MethodActor', 'Model', 'FashionModel', 'CommercialModel', 'FitnessModel', 'Dancer', 'Choreographer', 'BackgroundDancer', 'StuntPerformer', 'ActionPerformer', 'Presenter', 'Host', 'Anchor', 'VJ', 'MC', 'Comedian', 'StandUpComedian', 'MimeArtist', 'Puppeteer', 'MotionCaptureActor'],
  },
  {
    group: 'Cinematography & Camera',
    labels: ['Cinematographer', 'DOP', 'DirectorOfPhotography', 'CameraOperator', 'FirstAC', 'SecondAC', 'FocusPuller', 'CameraAssistant', 'CameraTrainee', 'DIT', 'DigitalImagingTechnician', 'DataManager', 'CameraSupervisor', 'SteadicamOperator', 'GimbalOperator', 'DroneOperator', 'DronePilot', 'AerialCinematographer', 'UnderwaterCinematographer', 'VideoOperator', 'VideoAssist', 'CameraTechnician', 'CameraRentalTechnician', 'Photographer', 'UnitPhotographer', 'BehindTheScenesPhotographer', 'StillPhotographer'],
  },
  {
    group: 'Lighting & Electrical',
    labels: ['Gaffer', 'BestBoy', 'BestBoyElectric', 'LightingTechnician', 'LightingAssistant', 'LightingDirector', 'ChiefLightingTechnician', 'Electrician', 'LightingOperator', 'LEDTechnician', 'Grip', 'KeyGrip', 'BestBoyGrip', 'DollyGrip', 'RiggingGrip', 'RiggingGaffer', 'RiggingElectrician', 'GripAssistant', 'LightingConsoleOperator'],
  },
  {
    group: 'Sound & Audio',
    labels: ['SoundDesigner', 'SoundRecordist', 'ProductionSoundMixer', 'LocationSoundRecordist', 'BoomOperator', 'SoundAssistant', 'SoundEngineer', 'AudioEngineer', 'AudioMixer', 'DialogueEditor', 'ADRRecordist', 'ADRSupervisor', 'FoleyArtist', 'FoleyRecordist', 'FoleyEditor', 'ReRecordingMixer', 'MusicMixer', 'AudioPostProduction', 'VoiceOverRecordist', 'SoundEffectsEditor', 'SoundSupervisor', 'LiveSoundEngineer'],
  },
  {
    group: 'Art Department & Production Design',
    labels: ['ProductionDesigner', 'ArtDirector', 'AssistantArtDirector', 'ArtAssistant', 'SetDesigner', 'SetDecorator', 'SetDresser', 'PropMaster', 'AssistantPropMaster', 'PropertyAssistant', 'PropMaker', 'ScenicArtist', 'SetPainter', 'MuralArtist', 'GraphicArtist', 'StoryboardArtist', 'ConceptArtist', 'Illustrator', 'ModelMaker', 'ConstructionManager', 'SetConstruction', 'Carpenter', 'SetBuilder', 'OnSetDecorator', 'ArtDepartmentCoordinator'],
  },
  {
    group: 'Costume, Makeup & Hair',
    labels: ['CostumeDesigner', 'CostumeStylist', 'WardrobeStylist', 'FashionStylist', 'AssistantCostumeDesigner', 'CostumeAssistant', 'WardrobeAssistant', 'CostumeSupervisor', 'CostumeMaker', 'Tailor', 'FashionDesigner', 'MakeupArtist', 'ProstheticMakeupArtist', 'SFXMakeupArtist', 'SpecialEffectsMakeup', 'HairStylist', 'HairAndMakeupArtist', 'KeyMakeupArtist', 'AssistantMakeupArtist', 'MakeupSupervisor', 'GroomingArtist', 'PersonalStylist'],
  },
  {
    group: 'Editing & Post-Production',
    labels: ['FilmEditor', 'VideoEditor', 'AssistantEditor', 'OfflineEditor', 'OnlineEditor', 'ChiefEditor', 'TrailerEditor', 'PromoEditor', 'DocumentaryEditor', 'CommercialEditor', 'MusicVideoEditor', 'WebSeriesEditor', 'PostProductionSupervisor', 'PostProductionCoordinator', 'PostProductionAssistant', 'PostProductionManager', 'FinishingArtist', 'ConformArtist', 'DIArtist', 'Colorist', 'Colourist', 'ColorGrading', 'ColorGradingArtist', 'FilmRestorationArtist', 'Subtitler', 'SubtitleEditor', 'CaptionEditor', 'QCOperator'],
  },
  {
    group: 'VFX, Animation & Motion Graphics',
    labels: ['VFXArtist', 'VFXSupervisor', 'VFXProducer', 'VFXCoordinator', 'VFXCompositor', 'Compositor', 'RotoArtist', 'RotoscopeArtist', 'PaintArtist', 'CleanupArtist', 'MatchmoveArtist', 'TrackingArtist', '3DArtist', '3DAnimator', '2DAnimator', 'CharacterAnimator', 'AnimationDirector', 'AnimationArtist', 'MotionGraphicsArtist', 'MotionDesigner', 'CGArtist', 'CGSupervisor', 'CGGeneralist', 'CGLightingArtist', '3DModeler', 'TextureArtist', 'RiggingArtist', 'RenderingArtist', 'SimulationArtist', 'UnrealEngineArtist', 'VirtualProductionArtist', 'VirtualProductionSupervisor', 'LEDWallTechnician'],
  },
  {
    group: 'Writing & Creative Development',
    labels: ['Screenwriter', 'Scriptwriter', 'StoryWriter', 'StoryDeveloper', 'DialogueWriter', 'StoryEditor', 'ScriptConsultant', 'ScriptDoctor', 'ScreenplayWriter', 'TeleplayWriter', 'CreativeWriter', 'ContentWriter', 'Copywriter', 'Lyricist', 'Researcher', 'FilmResearcher', 'StoryProducer', 'NarrativeDesigner', 'CreativeConsultant'],
  },
  {
    group: 'Music & Composition',
    labels: ['FilmComposer', 'MusicComposer', 'MusicDirector', 'MusicProducer', 'BackgroundScoreComposer', 'BackgroundMusicComposer', 'MusicArranger', 'Orchestrator', 'MusicSupervisor', 'MusicEditor', 'SoundtrackProducer', 'Singer', 'PlaybackSinger', 'Vocalist', 'Rapper', 'Musician', 'Guitarist', 'Pianist', 'Drummer', 'Violinist', 'SessionMusician', 'RecordingEngineer', 'MasteringEngineer', 'MixingEngineer', 'BeatProducer', 'MusicProgrammer'],
  },
  {
    group: 'Stunts, Action & Special Effects',
    labels: ['StuntCoordinator', 'StuntDirector', 'StuntDouble', 'BodyDouble', 'ActionDirector', 'FightChoreographer', 'FightCoordinator', 'MartialArtsPerformer', 'WireWorkArtist', 'PrecisionDriver', 'StuntDriver', 'SpecialEffectsSupervisor', 'SFXSupervisor', 'SpecialEffectsTechnician', 'PracticalEffectsArtist', 'Pyrotechnician', 'ExplosivesTechnician', 'Armorer', 'SafetyCoordinator', 'IntimacyCoordinator', 'AnimalHandler', 'AnimalTrainer', 'HorseTrainer'],
  },
  {
    group: 'Locations, Logistics & Operations',
    labels: ['LocationAssistant', 'LocationCoordinator', 'ProductionDriver', 'TransportCoordinator', 'TransportCaptain', 'ProductionRunner', 'TravelCoordinator', 'AccommodationCoordinator', 'LogisticsCoordinator', 'UnitAssistant', 'SetPA', 'ProductionOfficeAssistant', 'CateringCoordinator', 'ProductionCaterer', 'Medic', 'SetMedic', 'FirstAidOfficer', 'SecurityCoordinator', 'CrowdCoordinator', 'CrowdController'],
  },
  {
    group: 'Photography & Promotional Content',
    labels: ['FilmPhotographer', 'SetPhotographer', 'BTSPhotographer', 'BehindTheScenes', 'EventPhotographer', 'PortraitPhotographer', 'FashionPhotographer', 'ProductPhotographer', 'CommercialPhotographer', 'FoodPhotographer', 'LifestylePhotographer', 'Videographer', 'ContentVideographer', 'BrandVideographer', 'SocialMediaVideographer', 'ReelCreator', 'VideoCreator', 'ContentCreator', 'UGCCreator', 'YouTubeCreator', 'DocumentaryFilmmaker', 'WeddingFilmmaker', 'EventVideographer', 'MusicVideoDirector'],
  },
  {
    group: 'Digital, Studio & Broadcast Production',
    labels: ['StudioManager', 'StudioTechnician', 'BroadcastProducer', 'BroadcastDirector', 'BroadcastEngineer', 'VisionMixer', 'VisionSwitcher', 'OBTechnician', 'TelevisionDirector', 'TVProducer', 'TelevisionEditor', 'NewsProducer', 'NewsEditor', 'NewsCameraman', 'NewsCameraOperator', 'TeleprompterOperator', 'PlayoutOperator', 'StreamingTechnician', 'LivestreamProducer', 'LivestreamDirector', 'LivestreamOperator', 'PodcastProducer', 'PodcastEditor', 'PodcastVideographer', 'WebinarProducer'],
  },
  {
    group: 'Specialist Camera & Production Skills',
    labels: ['FPVDronePilot', 'DroneCinematographer', 'AerialCameraOperator', 'UnderwaterCameraOperator', 'TimeLapsePhotographer', 'MacroCinematographer', 'HighSpeedCameraOperator', 'MotionControlOperator', 'TechnocraneOperator', 'JibOperator', 'RoninOperator', 'RemoteHeadOperator', 'VirtualCameraOperator', '360VideoOperator', 'VRFilmmaker', '360Videographer'],
  },
]
