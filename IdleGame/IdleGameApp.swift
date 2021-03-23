//
//  IdleGameApp.swift
//  IdleGame
//
//  Created by Jack Williams on 26/02/2021.
//

import SwiftUI

@main
struct IdleGameApp: App {
    @StateObject private var modelData = ModelData()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(modelData)
        }
    }
}
