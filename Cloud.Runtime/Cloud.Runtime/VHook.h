/**
 * All Rights Reserved. Licensed under Cloud License
 * https://cloudfn.dev/CLICENSE
 */
#pragma once

#include "pch.h"
#include <cstdint>

class VHook {
private:
	static uintptr_t pTarget;
	static uintptr_t pDetour;

	static PVOID hHandle;
	static DWORD dwProtect;

public:
	static BOOL Hook(uintptr_t pTarget, uintptr_t pDetour);
	static BOOL Unhook();

private:
	static LONG WINAPI Handler(EXCEPTION_POINTERS* pExceptionInfo);

	static BOOL IsSamePage(const uint8_t* pFirstAddress, const uint8_t* pSecondAddress);
};
