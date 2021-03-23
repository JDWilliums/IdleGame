//
//  Cycle.swift
//  IdleGame
//
//  Created by Jack Williams on 21/03/2021.
//

import Foundation
import SwiftUI

struct Cycle: Hashable, Codable, Identifiable {
    var name: String
    var cost: Double
    var tax: Double
    var id: Int
    var imageName: String
    var amount: Int
    var isUnlocked: Bool
}
