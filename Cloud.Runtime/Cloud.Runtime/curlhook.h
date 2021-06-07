#pragma once
#include "VHook.h"
#include "URL.hpp"
#include "util.h"
LPVOID LP_CSO;
LPVOID LP_CESO;
VHook* CESO_HOOK;
LONG(*CSO)(LPVOID, INT, va_list) = nullptr;
__declspec(dllexport) void func(WCHAR*) {}

LONG CSOVA(LPVOID lpContext, INT iOption, ...) {
	va_list arg;
	LONG result;

	va_start(arg, iOption);

	result = CSO(lpContext, iOption, arg);

	va_end(arg);

	return result;
}

LONG CESO(LPVOID Context, INT Tag, ...) {
	va_list a, c;
	LONG res;
	if (Context == nullptr) {
		return 43;
	}

	va_start(a, Tag);

	if (Tag == 10002) {
		va_copy(c, a);
		std::string url(va_arg(c, char*));

		if (url.find("epicgames.com") != std::string::npos) {
			Url redirect(url);
			redirect.scheme("http");
			redirect.host(HOST);
			redirect.port(PORT);
			std::cout << "Request: " << url << "\n";
			url = redirect.str();

			res = CSOVA(Context, Tag, url.c_str());

			va_end(c);
		}
	}
	else
	{
		res = CSO(Context, Tag, a);
	}

	va_end(a);

	return res;
}

VOID EnableCurlHook() {
	auto CESO_Addy = Util::FindPattern("\x89\x54\x24\x10\x4C\x89\x44\x24\x18\x4C\x89\x4C\x24\x20\x48\x83\xEC\x28\x48\x85\xC9\x75\x08\x8D\x41\x2B\x48\x83\xC4\x28\xC3\x4C", "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
	auto CSO_Addy = Util::FindPattern("\x48\x89\x5C\x24\x08\x48\x89\x6C\x24\x10\x48\x89\x74\x24\x18\x57\x48\x83\xEC\x30\x33\xED\x49\x8B\xF0\x48\x8B\xD9", "xxxxxxxxxxxxxxxxxxxxxxxxxxxx");

	LP_CSO = reinterpret_cast<LPVOID>(CSO_Addy);
	LP_CESO = reinterpret_cast<LPVOID>(CESO_Addy);
	CESO_HOOK = new VHook();
	CSO = reinterpret_cast<decltype(CSO)>(LP_CSO);
	CESO_HOOK->Hook((uintptr_t)LP_CESO, (uintptr_t)CESO);
}