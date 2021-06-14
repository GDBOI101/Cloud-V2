/**
 * All Rights Reserved. Licensed under Cloud License
 * https://cloudfn.dev/CLICENSE
 */
#pragma once
//Settings
#define HOST std::string("127.0.0.1") //If hosting on Local Client it should be set to "127.0.0.1". If hosting on Cloud Hosted Backend change to you domain eg: cloudfn.dev
#define PORT std::string("4495") //If hosting on Local Client its the port your server is listening on. If hosting on Cloud this does not matter
//#define CLOUD //remove "//" at the beggining if you want host of of a Cloud Hosted Backend
#define LOCAL //(Default) add "//" at the beggining if hosting on Cloud

//includes
#include <Windows.h>
#include <windows.h>
#include <psapi.h>
#include <string>
#include <iostream>
#include <cstdarg>
#include <thread>
