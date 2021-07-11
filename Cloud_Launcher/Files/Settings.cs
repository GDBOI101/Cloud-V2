
using Newtonsoft.Json;
using System.IO;
using System.Reflection;

using static System.Environment;
// hey guess what this is aurora code // so uhh credits for pog work
namespace Cloud_Launcher_v2
{
    class Configuration
    {
        string _path = Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), "Settings.json");

        [JsonProperty("InstallLocation")]
        public string InstallLocation { get; set; }
        [JsonProperty("Email")]
        public string Email { get; set; }
        [JsonProperty("Password")]
        public string Password { get; set; }


        internal const string ClientExecutable = "FortniteClient-Win64-Shipping.exe";
#if !NO_EGL
        internal const string ClientArguments = "";
#else
        internal const string ClientArguments = "-epicapp=Fortnite -epicenv=Prod -epiclocale=en-us -epicportal";
#endif

        internal const string LauncherNative = "Cloud.Native.dll";
        internal const string LauncherUri = "https://cloudfn-backend.herokuapp.com";

        // TODO: Figure out how to generate FLToken's without hardcoding them.
        internal const string BEToken = "f7b9gah4h5380d10f721dd6a";
        internal const string EACToken = "10ga222d803bh65851660E3d";
        public void Open()
        {
            if (File.Exists(_path))
            {
                var configuration = JsonConvert.DeserializeObject<Configuration>(File.ReadAllText(_path));
                InstallLocation = configuration.InstallLocation;
                Email = configuration.Email;
                Password = configuration.Password;
            }
            else
            {
                foreach (EpicGames.Installed.Installation installation
                    in EpicGames.LauncherInstalled.InstallationList)
                {
                    if (installation.AppName == "Fortnite") // finds fortnite
                        InstallLocation = installation.InstallLocation;
                }

                

                Save();
            }
        }


        public void Save() => File.WriteAllText(_path, JsonConvert.SerializeObject(this)); // save
    }
}
