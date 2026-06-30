// Package findfont is a WASM-safe stub. Browser builds cannot scan host font directories.
package findfont

import "fmt"

func Find(fileName string) (string, error) {
	return "", fmt.Errorf("findfont: %s not available in this environment", fileName)
}

func List() []string {
	return nil
}
