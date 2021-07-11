using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Cloud_Launcher_v2
{
    partial class Form2 : Form
    {
        class Installed
        {


            public class Installation
            {
                public string InstallLocation { get; set; }

                public string AppName { get; set; }
                public string AppVersion { get; set; }
            }

            public Installation[] InstallationList { get; set; }
        }


        static Process _clientProcess;
        /// <summary>
        /// 0 = None, 1 = BattlEye, 2 = EasyAntiCheat
        /// </summary>
        static byte _clientAnticheat;

        public Configuration Configuration;
        public Form2()
        {
            InitializeComponent();
            Configuration = new Configuration();
            Configuration.Open();

            UserName.Text = Configuration.Email;
            Password.Text = Configuration.Password;
            FortnitePath.Text = Configuration.InstallLocation;
        }

        private void FortnitePath_TextChanged(object sender, EventArgs e)
        {
            Configuration.InstallLocation = FortnitePath.Text;
            Configuration.Save();
        }

        private void Password_TextChanged(object sender, EventArgs e)
        {
            Configuration.Password = Password.Text;
            Configuration.Save();
        }

        private void UserName_TextChanged(object sender, EventArgs e)
        {
            Configuration.Email = UserName.Text;
            Configuration.Save();
        }

        private void Form2_Load(object sender, EventArgs e)
        {
            Password.UseSystemPasswordChar =
                !Password.UseSystemPasswordChar;
        }

        private void button2_Click(object sender, EventArgs e)
        {
            Password.UseSystemPasswordChar =
                !Password.UseSystemPasswordChar;

            if (Password.UseSystemPasswordChar)
                button2.Text = "Show";
            else
                button2.Text = "Hide";
        }

        private void button1_Click(object sender, EventArgs e)
        {
            if (folderBrowserDialogBrowse.ShowDialog() == DialogResult.OK)
                FortnitePath.Text = folderBrowserDialogBrowse.SelectedPath;
        }
    }
}
