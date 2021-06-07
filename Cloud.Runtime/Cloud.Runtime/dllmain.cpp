// dllmain.cpp : Defines the entry point for the DLL application.
#include "pch.h"
#include "util.h"
#include "curlhook.h"
BOOL APIENTRY DllMain( HMODULE hModule,
                       DWORD  reason,
                       LPVOID lpReserved
                     )
{
    switch (reason)
    {
    case DLL_PROCESS_ATTACH:
        Util::InitConsole();
        printf("Welcome to CloudFN!");
        EnableCurlHook();
    case DLL_THREAD_ATTACH:
    case DLL_THREAD_DETACH:
    case DLL_PROCESS_DETACH:
        break;
    }
    return TRUE;
}

