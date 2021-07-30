using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using static System.Environment;

namespace WindowsFormsApp1
{
    static class EpicGames
    {
        public class Installed
        {
            public class Installation
            {
                [JsonProperty("AppName")]
                public string AppName { get; set; }

                [JsonProperty("AppVersion")]
                public string AppVersion { get; set; }
            }
        }

        public static Installed LauncherInstalled => GetLauncherInstalled();

        static Installed GetLauncherInstalled()
        {
            var path = Path.Combine(GetFolderPath(SpecialFolder.CommonApplicationData),
                "Epic\\UnrealEngineLauncher\\LauncherInstalled.dat");

            if (!File.Exists(path))
                return new Installed();
            else
                return JsonConvert.DeserializeObject<Installed>(File.ReadAllText(path));
        }
    }
}
